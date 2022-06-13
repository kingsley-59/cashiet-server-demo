const express = require('express');
const { setupMandate, activateMandateOtp, validateMandateOtp, fillMandateForm } = require('../controllers/buy-later');
const verifyAuth = require('../middleware/verify-auth');
const router = express.Router();

router.post('/setup', verifyAuth, setupMandate);

router.post('/activate-otp', verifyAuth, activateMandateOtp);

router.post('/validate-otp', verifyAuth, validateMandateOtp);

router.post('/mandate-form', verifyAuth, fillMandateForm);

module.exports = router;
