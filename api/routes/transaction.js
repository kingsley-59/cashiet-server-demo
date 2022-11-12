const express = require('express');
const {
	saveTransaction,
	getAllTransactions,
	getSingleTransaction,
	getAllUserTransactions,
	deleteTransaction,
	getOrderTransactions,
	adminGetSpecificUserTransactions
} = require('../controllers/transactions');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.post('/', verifyAuth, saveTransaction);

router.get('/', verifyAuth, getAllTransactions);

router.get('/admin/user/:userId', verifyAuth, adminGetSpecificUserTransactions);

router.get('/:transactionId', verifyAuth, getSingleTransaction);

router.get('/user/me', verifyAuth, getAllUserTransactions);

router.get('/order/:orderId', verifyAuth, getOrderTransactions);

router.delete('/:transactionId', verifyAuth, deleteTransaction);

module.exports = router;
