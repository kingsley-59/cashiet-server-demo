const express = require('express')
const { verifyTestTransaction, dumpPaymentDetailsTable, getUserPaymentDetails, processPayment } = require('../controllers/payment')
const router = express.Router()
const verifyAuth = require('../middleware/verify-auth')


router.get('/dump', dumpPaymentDetailsTable);

router.get('/verify/:reference', verifyAuth, verifyTestTransaction);

router.get('/user', verifyAuth, getUserPaymentDetails);

router.post('/', verifyAuth, processPayment);


module.exports = router