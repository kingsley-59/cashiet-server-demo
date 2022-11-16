const express = require('express')
const { verifyTestTransaction, dumpPaymentDetailsTable, getUserPaymentDetails, processPayment, removeCard } = require('../controllers/payment')
const router = express.Router()
const verifyAuth = require('../middleware/verify-auth')


router.get('/dump', dumpPaymentDetailsTable);

router.get('/verify/:reference', verifyAuth, verifyTestTransaction);

router.get('/user', verifyAuth, getUserPaymentDetails);

router.post('/', verifyAuth, processPayment);

router.delete('/remove-card/:cardId', verifyAuth, removeCard)


module.exports = router