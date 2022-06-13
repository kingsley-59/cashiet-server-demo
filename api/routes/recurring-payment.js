const express = require('express');
const verifyAuth = require('../middleware/verify-auth');
const {
	setupMandate,
	activateMandateRequestOtp,
	validateMandateOtp,
	checkMandateStatus,
	sendDebitInstruction,
	checkDebitStatus,
	cancelDebitInstruction,
	mandatePaymentHistory,
	stopMandate
} = require('../controllers/recurring-payment');
const router = express.Router();

router.post('/setup', verifyAuth, setupMandate);

router.post('/activate-otp', verifyAuth, activateMandateRequestOtp);

router.post('/validate-otp', verifyAuth, validateMandateOtp);

router.post('/check-status', verifyAuth, checkMandateStatus);

router.post('/debit-user', verifyAuth, sendDebitInstruction);

router.post('/debit-status', verifyAuth, checkDebitStatus);

router.post('/cancel-debit', verifyAuth, cancelDebitInstruction);

router.post('/payment-history', verifyAuth, mandatePaymentHistory);

router.post('/stop-mandate', verifyAuth, stopMandate);

router.post('/mandate-form', verifyAuth, stopMandate);

module.exports = router;
