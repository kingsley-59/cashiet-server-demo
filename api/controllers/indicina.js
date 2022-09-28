const mongoose = require('mongoose');
const Indicina = require('../models/indicina');
const OkraCustomer = require('../models/okra');
const axios = require('axios');
const creditDecision = require('../../utility/creditDecision');
require('dotenv').config();

const testTransactions = [
	{
		_id: '',
		notes: {
			desc: '',
			topics: [],
			places: [],
			people: [],
			actions: [''],
			subjects: [''],
			prepositions: ['']
		},
		manual: false,
		reconciled: false,
		fetched: [''],
		record: [''],
		actions: [],
		trans_date: '',
		cleared_date: '',
		unformatted_trans_date: '',
		unformatted_cleared_date: '',
		debit: 0.01,
		ref: ' ',
		bank: {
			icon: '',
			logo: '',
			name: '',
			status: ''
		},
		customer: {
			_id: '',
			name: ''
		},
		account: {
			_id: '',
			name: ''
		},
		env: '',
		checked: [],
		created_at: '',
		last_updated: '',
		__v: 0,
		id: ''
	}
];

const verifyUserAccount = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const indicinaToken = req?.indicina_token;
	const cost = req.body?.amount ?? 0;

	// get user okra details
	// get user account balance
	// use okra details to get transaction history
	let customer, transactions;
	try {
		customer = await OkraCustomer.findOne({ user: authenticatedUser._id }).select('okra_id firstname lastname email phone').exec();

		if (!customer) {
			res.status(400).json({ message: 'User is not an okra customer' });
			return;
		}

		let balanceResponse = await axios.post(
			'https://api.okra.ng/v2/balance/getById',
			{
				id: customer.okra_id
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.OKRA_SECRET_API_KEY}`
				}
			}
		)

		let response = await axios.post(
			'https://api.okra.ng/v2/transactions/getById',
			{
				id: customer.okra_id
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.OKRA_SECRET_API_KEY}`
				}
			}
		);

		if (response.status !== 200 || balanceResponse.status !== 200) {
			res.status(400).json({ message: 'Failed to get okra customer transaction details' });
			return;
		}

		const { data } = response;

		transactions = data?.data?.transaction;
		if (transactions.length < 1) {
			res.status(400).json({ message: 'There are no transactions available for this customer' });
			return;
		}
	} catch (error) {
		const { response } = error ?? {};
		// console.log(response?.data ?? error.message)
		res.status(500).json({ message: 'Could not look up okra customer records', data: response?.data });
		return;
	}

	// send transaction history to indicina for analysis
	// save analysis response on Indicina model
	try {
		const response = await axios.post(
			process.env.INDICINA_DECIDE_URL,
			{
				customer: {
					id: customer.okra_id,
					email: customer.email,
					lastName: customer.lastname,
					firstName: customer.firstname,
					phone: customer.phone
				}
			},
			{
				headers: { Authorization: `Bearer ${indicinaToken}` }
			}
		);

		if (response.status !== 200) {
			res.status(400).json({ message: 'Failed to get indicina decide details on transaction history' });
			return;
		}

		const result = creditDecision({
			indicinaAnalysisData: response.data?.data,
			lendingAmount: cost,
			balance: balanceResponse?.data?.balance?.available_balance
		})

		const decisionData = new Indicina({
			_id: new mongoose.Types.ObjectId(),
			customer: {
				id: customer.okra_id,
				email: customer.email,
				firstname: customer.firstname,
				lastname: customer.lastname
			},
			decision_data: response.data.data,
			user: authenticatedUser._id
		});
		const saveDecisionData = await decisionData.save();
		res.status(200).json({ message: 'Request successful', result, data: saveDecisionData });
	} catch (error) {
		const { response } = error ?? {};
		// console.log(response?.data ?? error.message)
		res.status(500).json({ message: 'Unable to get indicina decide details', data: response?.data });
		return;
	}
};

module.exports = {
	verifyUserAccount
};
