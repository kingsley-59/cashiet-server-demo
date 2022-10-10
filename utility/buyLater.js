const mongoose = require('mongoose');
const Profile = require('../api/models/profile');
const RecurringPayment = require('../api/models/recurring-payment');
const order = require('../api/models/order');
const remitaHelperFunction = require('./recurring-payment');
const { addMonths } = require('./addMonths');

class buyLater {
	async setupMandate(req, res) {
		const authenticatedUser = req.decoded.user;

		if (!req.body.order) {
			return res.status(400).json({ message: 'Order id is not found' });
		}

		const findUserProfile = await Profile.findOne({ user: authenticatedUser._id });

		if (!findUserProfile || !findUserProfile.firstName || !findUserProfile.lastName || !findUserProfile.phoneNumber) {
			return res.status(400).json({ message: 'User is yet to complete profile registration' });
		}

		const findOrder = await order.findOne({ _id: req.body.order }).populate('recurringPayment').exec() ;

		if (!findOrder || findOrder?.length == 0) {
			return res.status(400).json({ message: 'Order does not exist.' })
		}

		if (findOrder?.status !== 'pending') {
			return res.status(400).json({ message: 'Order must be pending' });
		}

		if (findOrder?.recurringPayment) {
			return res.status(400).json({ message: 'Mandate already set up', data: findOrder.recurringPayment });
		}

		const newDate = new Date();
		const now = newDate.getDate() + '/' + (newDate.getMonth() + 1) + '/' + newDate.getFullYear();

		const end = await addMonths(newDate, req.body.duration);
		const endDate = end.getDate() + '/' + (end.getMonth() + 1) + '/' + end.getFullYear();

		const saveDetails = new RecurringPayment({
			_id: new mongoose.Types.ObjectId(),
			payerBankCode: req.body.bankCode,
			payerAccountNumber: req.body.accountNumber,
			startDate: new Date(),
			endDate: end,
			duration: req.body.duration,
			splitAmount: findOrder.totalAmount / req.body.duration,
			profile: findUserProfile._id
		});

		await saveDetails.save();

		try {
			const setupMandate = await remitaHelperFunction.setupMandate(
				`${findUserProfile.firstName} ${findUserProfile.lastName}`,
				authenticatedUser.email,
				findUserProfile.phoneNumber,
				req.body.bankCode,
				req.body.accountNumber,
				findOrder.totalAmount,
				now,
				endDate,
				res
			);

			console.log('setup mandate', setupMandate);

			if (setupMandate.statuscode === '040') {
				findOrder.recurringPayment = saveDetails._id;
				await findOrder.save();

				saveDetails.requestId = setupMandate.requestId;
				saveDetails.mandateId = setupMandate.mandateId;
				await saveDetails.save();

				return res.status(201).json({ message: 'Mandate successfully created.', response: setupMandate });
			}

			return res.status(400).json({ message: 'unable to setup mandate', response: setupMandate });
		} catch (error) {
			return res.status(500).json({ message: 'An error occur while setting up mandate', error });
		}
	}

	async activateOtp(req, res) {
		const authenticatedUser = req.decoded.user;

		if (!req.body.order || !req.body.mandateId || !req.body.requestId) {
			return res.status(400).json({ message: 'Order id, request id and mandate id must be provided' });
		}

		const findOrder = await order.findOne({ _id: req.body.order, user: authenticatedUser._id }).exec();

		if (!findOrder) {
			return res.status(400).json({ message: 'Order does not exist.' })
		}

		if (findOrder?.status !== 'pending') {
			return res.status(400).json({ message: 'Order must be pending to request an otp' });
		}

		const buyLaterDetails = await RecurringPayment.findOne({ mandateId: req.body.mandateId });

		if (!buyLaterDetails) {
			return res.status(400).json({ message: 'Mandate with this id not found' });
		}

		if (buyLaterDetails.isActive) {
			return res.status(400).json({ message: 'Mandate is active' });
		}

		try {
			const activateMandateOtp = await remitaHelperFunction.activateOtp(req.body.mandateId, req.body.requestId);

			if (activateMandateOtp.statuscode === '00') {
				buyLaterDetails.remitaTransRef = activateMandateOtp.remitaTransRef;
				await buyLaterDetails.save();

				return res.status(201).json({ message: 'Validation successfully requested.', response: activateMandateOtp });
			}

			return res.json({ message: 'unable to activate otp', response: activateMandateOtp });
		} catch (error) {
			return res.status(500).json({ message: 'An error occur while activating otp', error });
		}
	}

	async validateOtp(req, res) {
		const authenticatedUser = req.decoded.user;

		if (!req.body.order || !req.body.mandateId || !req.body.requestId || !req.body.otp || !req.body.cardNumber) {
			return res.status(400).json({ message: 'Order id, request id, mandate id, otp and card number must be provided' });
		}

		const findOrder = await order.findOne({ _id: req.body.order, user: authenticatedUser._id });

		if (!findOrder) return res.status(400).json({ message: 'Order with that id not found' });

		if (findOrder?.status !== 'pending') return res.status(400).json({ message: 'Order must be pending to request an otp' });

		const buyLaterDetails = await RecurringPayment.findOne({ mandateId: req.body.mandateId });

		if (!buyLaterDetails) return res.status(400).json({ message: 'Mandate with this id not found' });

		if (buyLaterDetails.isActive) return res.status(400).json({ message: 'Mandate is active' });

		if (!buyLaterDetails.remitaTransRef) return res.status(400).json({ message: 'You have not activated otp' });

		try {
			const validateMandateOtp = await remitaHelperFunction.validateOtp(req.body.otp, req.body.cardNumber, buyLaterDetails.remitaTransRef);

			if (validateMandateOtp.statuscode === '00') {
				buyLaterDetails.isActive = true;
				await buyLaterDetails.save();

				await remitaHelperFunction.debitUser(
					req.body.order,
					buyLaterDetails.splitAmount,
					buyLaterDetails.mandateId,
					buyLaterDetails.payerAccountNumber,
					buyLaterDetails.payerBankCode
				);

				return res.status(201).json({ message: 'OTP successfully validated.', response: validateMandateOtp });
			}

			return res.json({ message: 'unable to validate otp', response: validateMandateOtp });
		} catch (error) {
			return res.status(500).json({ message: 'An error occur while validating otp', error });
		}
	}

	async fillMandateForm(req, res) {
		const authenticatedUser = req.decoded.user;

		if (!req.body.order || !req.body.mandateId || !req.body.requestId)
			return res.status(400).json({ message: 'Order id, request id and mandate id must be provided' });

		const findOrder = await order.findOne({ _id: req.body.order, user: authenticatedUser._id });

		if (!findOrder) return res.status(400).json({ message: 'Order with that id not found' });

		if (findOrder?.status !== 'pending') return res.status(400).json({ message: 'Order must be pending to request an otp' });

		const buyLaterDetails = await RecurringPayment.findOne({ mandateId: req.body.mandateId });

		if (!buyLaterDetails) return res.status(400).json({ message: 'Mandate with this id not found' });

		if (buyLaterDetails?.isActive) return res.status(400).json({ message: 'Mandate is active' });

		try {
			const fillMandateForm = await remitaHelperFunction.fillMandateForm(req.body.requestId, req.body.mandateId, res);
			// console.log(fillMandateForm);
			if (fillMandateForm.statuscode === '00') {
				return res.status(201).json({ message: 'Kindly verify the otp sent to you.', response: fillMandateForm });
			}

			return res.json({ message: 'unable to fill mandate form', response: fillMandateForm });
		} catch (error) {
			return res.status(500).json({ message: 'An error occur while filling mandate form', error });
		}
	}
}

module.exports = new buyLater();
