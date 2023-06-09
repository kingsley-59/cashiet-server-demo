const mongoose = require('mongoose');
const { default: slugify } = require('slugify');
const PaymentOptions = require('../models/payment-options');

const createPaymentOption = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const newPaymentOption = new PaymentOptions({
			_id: new mongoose.Types.ObjectId(),
			type: slugify(req.body.type),
			description: req.body.description
		});

		try {
			newPaymentOption
				.save()
				.then(() => res.status(201).json({ message: 'Payment Option saved successfully', status: 201 }))
				.catch(error => res.status(500).json({ error, message: 'Unable to create payment option' }));
		} catch (error) {
			return res.status(500).json({ error, message: error?.message, status: 500 });
		}
	}
};

const getAllPaymentOptions = (req, res, next) => {
	PaymentOptions.find()
		.select('type description')
		.then(paymentOptions => {
			return res
				.status(200)
				.json({ message: 'Successfully fetched all payment details', paymentOptions, total: paymentOptions.length, status: 200 });
		})
		.catch(error => {
			return res.status(500).json({ error, message: error?.message, status: 500 });
		});
};

const getOnePaymentOption = (req, res, next) => {
	const paymentId = req.params.paymentId;

	PaymentOptions.findById({ _id: paymentId })
		.select('type description')
		.then(paymentOption => res.status(200).json({ paymentOption, message: 'Successfully fetched payment option', status: 200 }))
		.catch(error => res.status(500).json({ error, message: error?.message, status: 500 }));
};

const deletePaymentOption = (req, res, next) => {
	const paymentId = req.params.paymentId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		PaymentOptions.findById({ _id: paymentId })
			.exec()
			.then(paymentOption => {
				if (paymentOption) {
					paymentOption.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Payment Option successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Payment Option does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error?.message, status: 500 });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

module.exports = {
	createPaymentOption,
	getAllPaymentOptions,
	getOnePaymentOption,
	deletePaymentOption
};
