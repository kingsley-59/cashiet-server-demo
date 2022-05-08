const express = require('express');
const {
	saveTransaction,
	getAllTransactions,
	getSingleTransaction,
	getAllUserTransactions,
	deleteTransaction
} = require('../controllers/transaction');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.post('/', verifyAuth, saveTransaction);

router.get('/', verifyAuth, getAllTransactions);

router.get('/:transactionId', verifyAuth, getSingleTransaction);

router.get('/me', verifyAuth, getAllUserTransactions);

router.delete('/:transactionId', verifyAuth, deleteTransaction);

module.exports = router;
