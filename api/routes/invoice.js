const express = require('express');
const { getAllInvoices, getSpecificInvoice, getAllUserInvoices, deleteInvoice } = require('../controllers/invoice');
const router = express.Router();
const verifyAuth = require("../middleware/verify-auth");

router.get('/', verifyAuth, getAllInvoices);

router.get('/me', verifyAuth, getAllUserInvoices);

router.get('/:orderId', verifyAuth, getSpecificInvoice);

router.delete('/:invoiceId', verifyAuth, deleteInvoice);

module.exports = router;
