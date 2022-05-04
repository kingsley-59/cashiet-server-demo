const express = require('express');
const { getAllPaymentOptions, createPaymentOption, getOnePaymentOption, deletePaymentOption } = require('../controllers/payment');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.get('/', getAllPaymentOptions);

router.post('/', verifyAuth, createPaymentOption);

router.get('/:paymentId', verifyAuth, getOnePaymentOption);

router.delete('/:paymentId', verifyAuth, deletePaymentOption);

module.exports = router;
