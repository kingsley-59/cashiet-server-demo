const mongoose = require('mongoose');
const Invoice = require('../models/invoice');
const Transaction = require('../models/transaction');
const { default: axios } = require('axios');
const CardDetails = require('../models/card-details');

const config = {
	headers: { Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET}` }
};

const saveTransaction = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	try {
		const response = await axios.get(`https://api.paystack.co/transaction/verify/${req.body.reference}`, config);
		//

		if (response.status === 200 && response.data?.data?.status === 'success') {
			const transactionDetails = new Transaction({
				_id: new mongoose.Types.ObjectId(),
				invoice: req.body.invoice,
				// order: req.body.order,
				user: authenticatedUser._id,
				transactionDetails: {
					domain: response.data?.data?.domain,
					status: response.data?.data?.status,
					reference: response.data?.data?.reference,
					amount: response.data?.data?.amount,
					message: response.data?.data?.message,
					gateway_response: response.data?.data?.gateway_response,
					paid_at: response.data?.data?.paid_at,
					created_at: response.data?.data?.created_at,
					channel: response.data?.data?.channel,
					currency: response.data?.data?.currency,
					ip_address: response.data?.data?.ip_address
				}
			});

			return transactionDetails
				.save()
				.then(transaction => {
					Invoice.findOne({ order: req.body.order })
						.populate('order')
						.then(invoiceDetails => {
							if (!invoiceDetails) return res.status(404).json({ message: 'Unable to fetch invoice details' });

							const newAmount = invoiceDetails.amount + transaction.transactionDetails.amount;

							Invoice.updateOne(
								{ order: req.body.order },
								{ $set: { amount: newAmount, status: newAmount >= transaction.transactionDetails.amount ? 'paid' : 'part_payment' } }
							)
								.exec()
								.then(() => {
									CardDetails.findOne({
										user: authenticatedUser._id,
										authorization_code: response.data?.data?.authorization?.authorization_code
									})
										.then(card => {
											if (!card) {
												const newCard = new CardDetails({
													_id: new mongoose.Types.ObjectId(),
													user: authenticatedUser._id,
													authorization_code: response.data?.data?.authorization?.authorization_code,
													card_type: response.data?.data?.authorization?.card_type,
													bin: response.data?.data?.authorization?.bin,
													last4: response.data?.data?.authorization?.last4,
													exp_month: response.data?.data?.authorization?.exp_month,
													exp_year: response.data?.data?.authorization?.exp_year,
													channel: response.data?.data?.authorization?.channel,
													card_type: response.data?.data?.authorization?.card_type,
													bank: response.data?.data?.authorization?.bank,
													country_code: response.data?.data?.authorization?.country_code,
													brand: response.data?.data?.authorization?.brand,
													reusable: response.data?.data?.authorization?.reusable,
													signature: response.data?.data?.authorization?.signature,
													account_name: response.data?.data?.authorization?.account_name,
													customer: {
														id: response.data?.data?.customer?.id,
														customer_code: response.data?.data?.customer?.customer_code,
														first_name: response.data?.data?.customer?.first_name,
														last_name: response.data?.data?.customer?.last_name,
														email: response.data?.data?.customer?.email
													}
												});

												newCard
													.save()
													.then(response =>
														res.status(200).json({
															message: 'Transaction saved successfully',
															cardDetails: response,
															transactionDetails: transaction
														})
													)
													.catch(error => res.status(500).json({ error }));
											}
										})
										.catch(error => {
											return res.status(500).json({ error });
										});
								})
								.catch(error => res.status(500).json({ error, message: 'Unable to update invoice' }));
						})
						.catch(error => res.status(500).json({ error, message: 'Unable to fetch invoice details' }));
				})
				.catch(error => {
					return res.status(500).json({ error });
				});
		} else {
			return res.status(response.status).json({ response });
		}
	} catch (error) {
		return res.status(500).json({ error, message: 'Unable to verify transaction' });
	}
};

const getAllUserTransactions = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Transaction.find({ user: authenticatedUser._id })
		.populate('invoice user')
		.then(allTransactions =>
			res.status(200).json({ message: 'Successfully fetched all transactions', allTransactions, total: allTransactions.length })
		)
		.catch(error => res.status(500).json({ error }));
};

const getAllTransactions = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Transaction.find()
			.populate('invoice user')
			.then(allTransactions =>
				res.status(200).json({ message: 'Successfully fetched all transactions', allTransactions, total: allTransactions.length })
			)
			.catch(error => res.status(500).json(error));
	} else res.status(401).json({ message: 'Unauthorized users' });
};

const getSingleTransaction = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const transactionId = req.params.transactionId;

	if (authenticatedUser.role === 'admin') {
		Transaction.find({ _id: transactionId })
			.populate('invoice order user')
			.then(transaction => {
				if (transaction) {
					res.status(200).json({ message: 'Transaction fetched successfully', transaction });
				} else res.status(404).json({ message: 'Transaction not found' });
			})
			.catch(error => res.status(500).json(error));
	} else {
		Transaction.find({ _id: transactionId, user: authenticatedUser._id })
			.populate('invoice order user')
			.then(transaction => {
				if (transaction) {
					res.status(200).json({ message: 'Transaction fetched successfully', transaction });
				} else res.status(404).json({ message: 'Transaction not found' });
			})
			.catch(error => res.status(500).json(error));
	}
};

const deleteTransaction = (req, res, next) => {
	console.log('here');
	const id = req.params.transactionId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Transaction.findById({ _id: id })
			.exec()
			.then(transaction => {
				if (transaction) {
					transaction.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Transaction successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Transaction does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	saveTransaction,
	getAllUserTransactions,
	getAllTransactions,
	getSingleTransaction,
	deleteTransaction
};
