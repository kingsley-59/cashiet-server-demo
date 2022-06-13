const mongoose = require('mongoose');
const Invoice = require('../models/invoice');
const Transaction = require('../models/transaction');
const { default: axios } = require('axios');
// const CardDetails = require('../models/card-details');
const Order = require('../models/order');
const CryptoJS = require('crypto-js');

const saveTransaction = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const transactionId = req.body.transactionId;
	const publicKey = process.env.REMITA_PUBLIC_KEY;
	const secretKey = process.env.REMITA_SECRET_KEY;

	Transaction.findOne({ transactionId: req.body.transactionId })
		.then(async transaction => {
			if (!transaction) {
				const config = {
					headers: {
						Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET}`,
						publicKey,
						TXN_HASH: CryptoJS.SHA512(transactionId + secretKey)
					}
				};

				const response = await axios.get(`https://remitademo.net/payment/v1/payment/query/${req.body.transactionId}`, config);

				try {
					if (response.status === 200 && response.data?.responseCode === '00') {
						const transactionDetails = new Transaction({
							_id: new mongoose.Types.ObjectId(),
							invoice: req.body.invoice,
							// order: req.body.order,
							user: authenticatedUser._id,
							status: response?.data?.status,
							transactionId: req.body.transactionId,
							responseCode: response?.data?.responseCode,
							responseMsg: response?.data?.responseMsg,
							iResponseCode: response?.data?.iResponseCode,
							iResponseMessage: response?.data?.iResponseMessage,
							appVersionCode: response?.data?.appVersionCode,
							responseData: {
								paymentReference: response.data?.responseData[0]?.paymentReference,
								amount: response.data?.responseData[0]?.amount,
								paymentState: response.data?.responseData[0]?.paymentState,
								paymentDate: response.data?.responseData[0]?.paymentDate,
								processorId: response.data?.responseData[0]?.processorId,
								transactionId: response.data?.responseData[0]?.transactionId,
								tokenized: response.data?.responseData[0]?.tokenized,
								paymentToken: response.data?.responseData[0]?.paymentToken,
								cardType: response.data?.responseData[0]?.cardType,
								debitedAmount: response.data?.responseData[0]?.debitedAmount,
								message: response.data?.responseData[0]?.message,
								paymentChannel: response.data?.responseData[0]?.paymentChannel,
								customerId: response.data?.responseData[0]?.customerId,
								firstName: response.data?.responseData[0]?.firstName,
								lastName: response.data?.responseData[0]?.lastName,
								phoneNumber: response.data?.responseData[0]?.phoneNumber,
								email: response.data?.responseData[0]?.email,
								narration: response.data?.responseData[0]?.narration
							}
						});

						return transactionDetails
							.save()
							.then(transaction => {
								Invoice.findOne({ order: req.body.order })
									.populate('order')
									.then(invoiceDetails => {
										if (!invoiceDetails) return res.status(404).json({ message: 'Unable to fetch invoice details' });

										Invoice.findOne({ order: req.body.order, status: 'unpaid' })
											.exec()
											.then(invoiceDetails => {
												if (invoiceDetails) {
													Invoice.updateOne(
														{ order: req.body.order, status: 'unpaid' },
														{ $set: { amount: transaction.responseData.amount, status: 'paid' } }
													)
														.exec()
														.then(() => {
															Order.findOne({ _id: req.body.order })
																.then(orderDetails => {
																	Order.updateOne(
																		{ _id: req.body.order },
																		{
																			$set: {
																				paymentStatus:
																					orderDetails.remainingAmount <= transaction.responseData.amount
																						? 'paid'
																						: 'part_payment',
																				remainingAmount:
																					orderDetails.remainingAmount - transaction.responseData.amount,
																				status:
																					orderDetails.remainingAmount <= transaction.responseData.amount
																						? 'paid'
																						: 'pending'
																			}
																		}
																	)
																		.exec()
																		.then(() => {
																			res.status(200).json({
																				message: 'Transaction saved successfully',
																				transactionDetails: transaction
																			});
																		})
																		.catch(error =>
																			res.status(500).json({ error, message: 'Error updating order' })
																		);
																})
																.catch(error => res.status(500).json({ error, message: 'Error fetching order' }));
														})
														.catch(error => res.status(500).json({ error, message: 'Unable to update invoice' }));
												} else {
													const now = new Date();

													const newInvoice = new Invoice({
														_id: new mongoose.Types.ObjectId(),
														amount: transaction.responseData.amount,
														dateIssued: new Date(),
														expiryDate: now.getDate() + 5,
														order: req.body.order,
														status: 'paid'
													});

													return newInvoice
														.save()
														.then(() => {
															Order.findOne({ _id: req.body.order })
																.then(orderDetails => {
																	Order.updateOne(
																		{ _id: req.body.order },
																		{
																			$set: {
																				paymentStatus:
																					orderDetails.remainingAmount <= transaction.responseData.amount
																						? 'paid'
																						: 'part_payment',
																				remainingAmount:
																					orderDetails.remainingAmount - transaction.responseData.amount
																			}
																		}
																	)
																		.exec()
																		.then(() => {
																			res.status(200).json({
																				message: 'Transaction saved successfully',
																				transactionDetails: transaction
																			});
																		})
																		.catch(error =>
																			res.status(500).json({ error, message: 'Error updating order' })
																		);
																})
																.catch(error => res.status(500).json({ error }));
														})
														.catch(error => {
															return res.status(500).json({ error, message: 'Unable to create invoice' });
														});
												}
											})
											.catch(error => {
												return res.status(500).json({ error });
											});
									})
									.catch(error => res.status(500).json({ error, message: 'Unable to fetch invoice details' }));
							})
							.catch(error => {
								return res.status(500).json({ error });
							});
					} else {
						return res.status(response.status).json({ response, message: 'Error trying to save transaction details' });
					}
				} catch (error) {
					return res.status(500).json({ error, message: 'Unable to verify transaction' });
				}
			} else res.status(400).json({ message: 'Transaction with that transactionId already found and recorded' });
		})
		.catch(error => res.status(500).json({ error }));
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

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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

const getOrderTransactions = (req, res) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	Transaction.find({ user: authenticatedUser._id })
		.populate('invoice')
		.exec()
		.then(orderTransactions => {
			if (orderTransactions.length > 0) {
				const transactionOrders = orderTransactions?.filter(transaction => transaction?.invoice?.order?.toString() === orderId);

				res.status(200).json({
					message: 'Transactions attached to the order fetched successfully',
					allTransactions: transactionOrders,
					total: transactionOrders.length
				});
			} else res.status(404).json({ message: 'No transaction attached to the order found' });
		})
		.catch(error => res.status(500).json(error));
};

const deleteTransaction = (req, res, next) => {
	const id = req.params.transactionId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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
	deleteTransaction,
	getOrderTransactions
};
