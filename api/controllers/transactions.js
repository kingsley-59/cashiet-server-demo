const mongoose = require('mongoose')
const Invoice = require('../models/invoice');
const Order = require('../models/order');
const Transactions = require('../models/transactions');
const { verifyTransactionGetToken } = require('../service/paystack');


const saveTransaction = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const {reference, invoiceId, orderId} = req.body;

    try {
        // verify transaction before saving.
        console.log('verifying transaction...')
        const { data } = await verifyTransactionGetToken(reference)
        if (data.status !== 'success') return res.status(400).json({message: 'Could not verify transaction'})

        // check if order has been paid
        console.log('checking if order is paid...')
		const order = await Order.findOne({_id: orderId}).exec()
		if (order.status === 'paid') return res.status(400).json({message: 'Oops! You have paid for this order before.'})

		// check if transaction exists
        const transactionExists = await Transactions.findOne({reference: reference}).exec()
        if (transactionExists) return res.status(400).json({message: `Transaction with reference - ${reference} already exists.`})

        // update invoice and order
        console.log('update invoice and order status')
		order.status = 'paid'
		await order.save()
        const invoice = await Invoice.findOneAndUpdate({_id: invoiceId}, {status: 'paid'}, {new: true}).exec()

        // save incoming transaction
        console.log('saving new transaction...')
        const transaction = new Transactions({
            invoice, order,
            user: authenticatedUser._id,
            reference,
            response: data
        });
        await transaction.save();
        console.log('Saved!')
        res.status(201).json({message: 'Transaction created successfully.'})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

const getAllUserTransactions = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Transactions.find({ user: authenticatedUser._id })
		.populate('invoice user')
		.then(allTransactions =>
			res.status(200).json({ message: 'Successfully fetched all transactions', allTransactions, total: allTransactions.length })
		)
		.catch(error => res.status(500).json({ error }));
};

const adminGetSpecificUserTransactions = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const userId = req.params?.userId;

	if (authenticatedUser.role !== 'admin' || authenticatedUser.role !== 'superadmin')
		return res.status(403).json({ message: 'You are not authorized to perform this action' });

	Transactions.find({ user: userId })
		.populate('invoice user')
		.then(allTransactions =>
			res.status(200).json({ message: 'Successfully fetched all transactions', allTransactions, total: allTransactions.length })
		)
		.catch(error => res.status(500).json({ error }));
};

const getAllTransactions = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Transactions.find()
			.populate('invoice user')
			.then(allTransactions =>
				res.status(200).json({ message: 'Successfully fetched all transactions', transactions: res.paginatedResults, allTransactions, total: allTransactions.length })
			)
			.catch(error => res.status(500).json(error));
	} else res.status(401).json({ message: 'Unauthorized users' });
};

const getSingleTransaction = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const transactionId = req.params.transactionId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Transactions.find({ _id: transactionId })
			.populate('invoice order user')
			.then(transaction => {
				if (transaction) {
					res.status(200).json({ message: 'Transaction fetched successfully', transaction });
				} else res.status(200).json({ message: 'Transaction not found' });
			})
			.catch(error => res.status(500).json(error));
	} else {
		Transactions.find({ _id: transactionId, user: authenticatedUser._id })
			.populate('invoice order user')
			.then(transaction => {
				if (transaction) {
					res.status(200).json({ message: 'Transaction fetched successfully', transaction });
				} else res.status(200).json({ message: 'Transaction not found' });
			})
			.catch(error => res.status(500).json(error));
	}
};

const getOrderTransactions = (req, res) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const user = req.body.userId

		if (!user) return res.status(400).json({message: 'UserId is required in the payload!'})

		Transactions.find({ user: user })
		.populate('invoice')
		.exec()
		.then(orderTransactions => {
			if (orderTransactions.length > 0) {
				const transactionOrders = orderTransactions?.filter(transaction => transaction?.invoice?.order?.toString() === orderId);
				if (transactionOrders.length === 0) return res.status(200).json({ message: 'No transaction attached to the order found' });

				res.status(200).json({
					message: 'Transactions attached to the order fetched successfully',
					allTransactions: transactionOrders,
					total: transactionOrders.length
				});
			} else res.status(200).json({ message: 'No transaction attached to the user found' });
		})
		.catch(error => res.status(500).json(error));
		return ;
	}

	Transactions.find({ user: authenticatedUser._id })
		.populate('invoice')
		.exec()
		.then(orderTransactions => {
			const transactionOrders = orderTransactions?.filter(transaction => transaction?.order?.toString() === orderId);
			res.status(200).json({
				message: transactionOrders.length === 0 ? 'No transactions yet for this order.' : 'Transactions attached to the order fetched successfully',
				allTransactions: transactionOrders,
				total: transactionOrders.length
			});
		})
		.catch(error => res.status(500).json(error));
};

const deleteTransaction = (req, res, next) => {
	const id = req.params.transactionId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Transactions.findById({ _id: id })
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
	} else res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};


module.exports = {
	saveTransaction,
	getAllUserTransactions,
	adminGetSpecificUserTransactions,
	getAllTransactions,
	getSingleTransaction,
	deleteTransaction,
	getOrderTransactions
};