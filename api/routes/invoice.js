const express = require('express');
const {
	getAllInvoices,
	getSpecificInvoice,
	getAllUserInvoices,
	deleteInvoice,
	getOrderInvoices,
	adminGetSpecificUserInvoices
} = require('../controllers/invoice');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.get('/', verifyAuth, getAllInvoices);

router.get('/me', verifyAuth, getAllUserInvoices);

router.get('/admin/user/:userId', verifyAuth, adminGetSpecificUserInvoices);

router.get('/order/:orderId', verifyAuth, getOrderInvoices);

router.get('/:invoiceId', verifyAuth, getSpecificInvoice);

router.delete('/:invoiceId', verifyAuth, deleteInvoice);

module.exports = router;
    