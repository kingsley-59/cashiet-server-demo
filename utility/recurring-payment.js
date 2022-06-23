const mongoose = require('mongoose');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const { parseResponse } = require('./parseRemitaResponse');
const Invoice = require('../api/models/invoice');
const Transaction = require('../api/models/transaction');
const order = require('../api/models/order');

require('dotenv').config();

const BASE_URL = process.env.REMITA_RECURRING_PAYMENT_DEMO;
const FORM_LINK = process.env.REMITA_FORM_DEMO_API;
const MERCHANT_ID = process.env.REMITA_MERCHANT_ID;
const SERVICE_TYPE_ID = process.env.REMITA_SERVICE_TYPE_ID;
const API_KEY = process.env.REMITA_API_KEY;
const API_TOKEN = process.env.REMITA_API_TOKEN;

const getTimeStamp = () => {
	const now = new Date();
	let dd = now.getDate();
	let mm = now.getMonth() + 1; //January is 0!
	let yyyy = now.getFullYear();
	if (dd < 10) {
		dd = '0' + dd;
	}
	if (mm < 10) {
		mm = '0' + mm;
	}
	let hours = now.getUTCHours();
	let minutes = now.getUTCMinutes();
	let seconds = now.getUTCSeconds();
	let timeStamp = yyyy + '-' + mm + '-' + dd + 'T' + hours + ':' + minutes + ':' + seconds + '+000000';
	return timeStamp;
};

class RecurringPayment {
	stopMandate = async (mandateId, requestId) => {
		const hash = CryptoJS.SHA512(mandateId + MERCHANT_ID + requestId + API_KEY);

		const data = {
			merchantId: MERCHANT_ID,
			mandateId: mandateId,
			requestId: requestId,
			hash: hash?.toString()
		};

		try {
			const response = await axios.post(`${BASE_URL}/stop`, data);

			if (!response) {
				return res.status(500).json({ message: 'Error occur' });
			}

			return parseResponse(response?.data);
		} catch (error) {
			res.status(500).json({ error: error.response });
		}
	};

	sendDebitInstruction = async (amount, mandateId, fundingAccount, fundingBankCode) => {
		const now = new Date();
		const requestId = now.getTime();
		const hash = CryptoJS.SHA512(MERCHANT_ID + SERVICE_TYPE_ID + requestId + amount + API_KEY);

		const data = {
			merchantId: MERCHANT_ID,
			serviceTypeId: SERVICE_TYPE_ID,
			hash: hash?.toString(),
			requestId,
			totalAmount: amount,
			mandateId: mandateId,
			fundingAccount,
			fundingBankCode
		};

		try {
			const response = await axios.post(`${BASE_URL}/payment/send`, data);

			if (!response) {
				// return res.status(500).json({ message: 'Error occur' });
				return;
			}

			return parseResponse(response?.data);
		} catch (error) {
			res.status(500).json({ error: error.response });
		}
	};

	setupMandate = async (payerName, payerEmail, payerPhone, payerBankCode, payerAccountNumber, amount, startDate, endDate, res) => {
		console.log('1');
		const now = new Date();
		const REQUEST_ID = now.getTime();
		const AMOUNT = amount;
		const hash = CryptoJS.SHA512(MERCHANT_ID + SERVICE_TYPE_ID + REQUEST_ID + AMOUNT + API_KEY);

		var data = {
			merchantId: MERCHANT_ID,
			serviceTypeId: SERVICE_TYPE_ID,
			hash: hash?.toString(),
			payerName: payerName,
			payerEmail: payerEmail,
			payerPhone: payerPhone,
			payerBankCode: payerBankCode,
			payerAccount: payerAccountNumber,
			requestId: REQUEST_ID,
			amount: AMOUNT,
			startDate: startDate,
			endDate: endDate,
			mandateType: 'DD',
			maxNoOfDebits: '20'
		};

		const config = {
			headers: {
				'Content-Type': 'application/json'
			}
		};

		const setupDirectDebit = await axios.post(`${BASE_URL}/setup`, data, config);

		if (!setupDirectDebit) {
			return res.status(500).json({ message: 'Error occur' });
		}

		return parseResponse(setupDirectDebit?.data);
	};

	activateOtp = async (mandateId, requestId) => {
		const now = new Date();
		const transactionId = now.getTime();

		const config = {
			headers: {
				'Content-Type': 'application/json',
				MERCHANT_ID,
				API_KEY,
				REQUEST_ID: transactionId,
				REQUEST_TS: getTimeStamp(),
				MANDATE_ID: mandateId,
				API_DETAILS_HASH: CryptoJS.SHA512(API_KEY + transactionId + API_TOKEN)
			}
		};

		const data = {
			requestId: requestId,
			mandateId: mandateId
		};

		const activateRequestOtp = await axios.post(`${BASE_URL}/requestAuthorization`, data, config);

		if (!activateRequestOtp) {
			return res.status(500).json({ message: 'Error occur' });
		}

		return parseResponse(activateRequestOtp?.data);
	};

	validateOtp = async (otp, cardNumber, remitaTransRef) => {
		const now = new Date();
		const requestId = now.getTime();

		const config = {
			headers: {
				'Content-Type': 'application/json',
				MERCHANT_ID,
				API_KEY,
				REQUEST_ID: requestId,
				REQUEST_TS: getTimeStamp(),
				API_DETAILS_HASH: CryptoJS.SHA512(API_KEY + requestId + API_TOKEN)
			}
		};

		const data = {
			remitaTransRef,
			authParams: [
				{
					param1: 'OTP',
					value: otp
				},
				{
					param2: 'CARD',
					value: cardNumber
				}
			]
		};

		const response = await axios.post(`${BASE_URL}/validateAuthorization`, data, config);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		return parseResponse(response?.data);
	};

	debitUser = async (orderId, amount, mandateId, fundingAccount, fundingBankCode, monthlyTransaction = true) => {
		const performTransaction = async () => {
			const findOrder = await order.findOne({ _id: orderId });

			if (findOrder.remainingAmount <= 0) {
				return;
			}

			const response = await this.sendDebitInstruction(amount, mandateId, fundingAccount, fundingBankCode);
			// console.log('Debit instruction resonse', response);
			if (response.statuscode === '069') {
				// save invoice
				const newInvoice = new Invoice({
					_id: new mongoose.Types.ObjectId(),
					amount,
					dateIssued: new Date(),
					order: orderId,
					status: 'paid'
				});

				await newInvoice.save();

				try {
					// save transaction
					const transactionDetails = new Transaction({
						_id: new mongoose.Types.ObjectId(),
						invoice: newInvoice._id,
						user: findOrder.user,
						status: response.status,
						transactionRef: response.transactionRef,
						transactionId: response.transactionRef,
						statuscode: response.statuscode,
						requestId: response.requestId,
						mandateId: response.mandateId,
						RRR: response.RRR,
						recurringPayment: true
					});

					await transactionDetails.save();
				} catch (error) {
					console.log(error);
				}

				findOrder.remainingAmount = findOrder.remainingAmount - amount;
				findOrder.paymentStatus = findOrder.remainingAmount <= amount ? 'paid' : 'part_payment';
				findOrder.status = findOrder.remainingAmount <= amount ? 'paid' : 'pending';
				findOrder.lastPaymentDate = new Date();
				if (!monthlyTransaction) {
					findOrder.failedTransactions = findOrder.failedTransactions - 1;
				}
				await findOrder.save();
			}

			if (monthlyTransaction) {
				findOrder.failedTransactions = findOrder.failedTransactions + 1;
				await findOrder.save();
			}
		};

		// let stopJob = false;

		// first initialize the transaction
		await performTransaction();

		// schedule for subsequent month
		// const now = new Date();
		// let hour = now.getHours(),
		// 	minutes,
		// 	date = now.getDate();

		// if (now.getMinutes() == 0) {
		// 	if (hour !== 0) {
		// 		hour = hour - 1;
		// 		minutes = 59;
		// 	} else {
		// 		minutes = 0;
		// 	}
		// } else {
		// 	minutes = now.getMinutes() - 1;
		// }

		// let job = cron.schedule(`${minutes} ${hour} ${date} * *`, async () => {
		// 	await performTransaction();
		// });

		// if (stopJob) {
		// 	job.stop();
		// }

		// job.start();
	};

	fillMandateForm = async (requestId, mandateId, res) => {
		const hash = CryptoJS.SHA512(MERCHANT_ID + requestId + API_KEY);

		const data = {
			merchantId: MERCHANT_ID,
			serviceTypeId: SERVICE_TYPE_ID,
			mandateId,
			requestId,
			hash: hash?.toString()
		};

		const response = await axios.get(`${FORM_LINK}/${MERCHANT_ID}/${hash}/${mandateId}/${requestId}/rest.reg`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		return parseResponse(response?.data, 6);
	};
}

module.exports = new RecurringPayment();
