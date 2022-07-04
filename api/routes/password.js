const express = require('express');
const { sendPasswordResetLink, resetPassword, changePassword } = require('../controllers/password');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');
const { validateUserInput } = require('../middleware/validateFields');
const commonSchema = require('../schema/general');
const passwordSchema = require('../schema/password');

router.post('/', validateUserInput(commonSchema.validateEmail), sendPasswordResetLink);

router.post('/reset', validateUserInput(passwordSchema.validateResetPassword), resetPassword);

router.put('/update', validateUserInput(passwordSchema.validateNewPassword), verifyAuth, changePassword);

module.exports = router;
