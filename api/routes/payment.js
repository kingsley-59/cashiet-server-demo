const express = require('express')
const { verifyTestTransaction, dumpPaymentDetailsTable, getUserPaymentDetails, getAllPaymentDetails, processPayment, removeCard, refundAddCardCharges, adminGetUserPaymentDetails, manualDebit } = require('../controllers/payment');
const { paginatedResults } = require('../middleware/pagination');
const router = express.Router()
const verifyAuth = require('../middleware/verify-auth')
const PaymentDetails = require('../models/payment-details')


router.get('/dump', dumpPaymentDetailsTable);

router.get('/verify/:reference', verifyAuth, verifyTestTransaction);

router.get('/user', verifyAuth, getUserPaymentDetails);

router.get('/user/:userId', verifyAuth, adminGetUserPaymentDetails)

router.get('/', verifyAuth, paginatedResults(PaymentDetails, 'user authorization customer', ''), getAllPaymentDetails);

router.post('/', verifyAuth, processPayment);

router.post('/debit/:userId', verifyAuth, manualDebit)

router.post('/refund/:reference', verifyAuth, refundAddCardCharges);

router.delete('/remove-card/:cardId', verifyAuth, removeCard)


module.exports = router