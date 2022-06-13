const User = require('../models/user');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const { parseResponse } = require('../../utility/parseRemitaResponse');

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

const setupMandate = async (req, res, next) => {
	const now = new Date();
	const REQUEST_ID = now.getTime();
	const AMOUNT = 300000;
	const hash = CryptoJS.SHA512(MERCHANT_ID + SERVICE_TYPE_ID + REQUEST_ID + AMOUNT + API_KEY);

	var data = {
		merchantId: MERCHANT_ID,
		serviceTypeId: SERVICE_TYPE_ID,
		hash: hash?.toString(),
		payerName: req.body.payerName,
		payerEmail: req.body.payerEmail,
		payerPhone: req.body.payerPhone,
		payerBankCode: req.body.payerBankCode,
		payerAccount: req.body.payerAccountNumber,
		requestId: REQUEST_ID,
		amount: AMOUNT,
		startDate: req.body.startDate,
		endDate: req.body.endDate,
		mandateType: 'DD',
		maxNoOfDebits: '20'
	};

	const config = {
		headers: {
			'Content-Type': 'application/json'
		}
	};

	try {
		const setupDirectDebit = await axios.post(`${BASE_URL}/setup`, data, config);

		if (!setupDirectDebit) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(setupDirectDebit.data) });
	} catch (error) {
		console.log('here');
		res.status(500).json({ error });
	}
};

const activateMandateRequestOtp = async (req, res, next) => {
	const now = new Date();
	const transactionId = now.getTime();

	const config = {
		headers: {
			'Content-Type': 'application/json',
			MERCHANT_ID,
			API_KEY,
			REQUEST_ID: transactionId,
			REQUEST_TS: getTimeStamp(),
			MANDATE_ID: req.body.mandateId,
			API_DETAILS_HASH: CryptoJS.SHA512(API_KEY + transactionId + API_TOKEN)
		}
	};

	const data = {
		requestId: req.body.requestId,
		mandateId: req.body.mandateId
	};

	try {
		const activateRequestOtp = await axios.post(`${BASE_URL}/requestAuthorization`, data, config);

		if (!activateRequestOtp) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(activateRequestOtp?.data) });
	} catch (error) {
		res.status(500).json({ error });
	}
};

const validateMandateOtp = async (req, res) => {
	const now = new Date();
	const requestId = now.getTime();
	console.log(getTimeStamp());

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
		remitaTransRef: req.body.remitaTransRef,
		authParams: [
			{
				param1: 'OTP',
				value: req.body.otp
			},
			{
				param2: 'CARD',
				value: req.body.cardNumber
			}
		]
	};

	try {
		const response = await axios.post(`${BASE_URL}/validateAuthorization`, data, config);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error });
	}
};

const checkMandateStatus = async (req, res) => {
	const hash = CryptoJS.SHA512(req.body.mandateId + MERCHANT_ID + req.body.requestId + API_KEY);

	const data = {
		merchantId: MERCHANT_ID,
		mandateId: req.body.mandateId,
		hash: hash?.toString(),
		requestId: req.body.requestId
	};

	try {
		const response = await axios.post(`${BASE_URL}/status`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error });
	}
};

const sendDebitInstruction = async (req, res) => {
	const now = new Date();
	const requestId = now.getTime();
	const hash = CryptoJS.SHA512(MERCHANT_ID + SERVICE_TYPE_ID + requestId + 1000 + API_KEY);

	const data = {
		merchantId: MERCHANT_ID,
		serviceTypeId: SERVICE_TYPE_ID,
		hash: hash?.toString(),
		requestId,
		totalAmount: 1000,
		mandateId: req.body.mandateId,
		fundingAccount: '057',
		fundingBankCode: '057'
	};

	try {
		const response = await axios.post(`${BASE_URL}/payment/send`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error: error.response });
	}
};

const checkDebitStatus = async (req, res) => {
	const hash = CryptoJS.SHA512(req.body.mandateId + MERCHANT_ID + req.body.requestId + API_KEY);

	const data = {
		merchantId: MERCHANT_ID,
		mandateId: req.body.mandateId,
		requestId: req.body.requestId,
		hash: hash?.toString()
	};

	try {
		const response = await axios.post(`${BASE_URL}/payment/status`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error: error.response });
	}
};

const cancelDebitInstruction = async (req, res) => {
	const hash = CryptoJS.SHA512(req.body.transactionRef + MERCHANT_ID + req.body.requestId + API_KEY);

	const data = {
		merchantId: MERCHANT_ID,
		mandateId: req.body.mandateId,
		requestId: req.body.requestId,
		hash: hash?.toString(),
		transactionRef: req.body.transactionRef
	};

	try {
		const response = await axios.post(`${BASE_URL}/payment/stop`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error: error.response });
	}
};

const mandatePaymentHistory = async (req, res) => {
	const hash = CryptoJS.SHA512(req.body.mandateId + MERCHANT_ID + req.body.requestId + API_KEY);

	const data = {
		merchantId: MERCHANT_ID,
		mandateId: req.body.mandateId,
		requestId: req.body.requestId,
		hash: hash?.toString()
	};

	try {
		const response = await axios.post(`${BASE_URL}/payment/history`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error: error.response });
	}
};

const stopMandate = async (req, res) => {
	const hash = CryptoJS.SHA512(req.body.mandateId + MERCHANT_ID + req.body.requestId + API_KEY);

	const data = {
		merchantId: MERCHANT_ID,
		mandateId: req.body.mandateId,
		requestId: req.body.requestId,
		hash: hash?.toString()
	};

	try {
		const response = await axios.post(`${BASE_URL}/stop`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error: error.response });
	}
};

const mandateForm = async (req, res) => {
	const hash = CryptoJS.SHA512(MERCHANT_ID + req.body.requestId + API_KEY);
	const mandateId = req.body.mandateId;
	const requestId = req.body.requestId;

	const data = {
		merchantId: MERCHANT_ID,
		serviceTypeId: SERVICE_TYPE_ID,
		mandateId,
		requestId,
		hash: hash?.toString()
	};

	try {
		const response = await axios.post(`${FORM_LINK}/${MERCHANT_ID}/${hash}/${mandateId}/${requestId}/rest.reg`, data);

		if (!response) {
			return res.status(500).json({ message: 'Error occur' });
		}

		res.json({ response: parseResponse(response?.data) });
	} catch (error) {
		res.status(500).json({ error: error.response });
	}
};

module.exports = {
	setupMandate,
	activateMandateRequestOtp,
	validateMandateOtp,
	checkMandateStatus,
	sendDebitInstruction,
	checkDebitStatus,
	cancelDebitInstruction,
	mandatePaymentHistory,
	stopMandate,
	mandateForm
};
