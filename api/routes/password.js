const express = require('express');
const { sendPasswordResetLink, resetPassword, changePassword } = require('../controllers/password');
const router = express.Router();
const verifyAuth = require("../middleware/verify-auth");

router.post('/', sendPasswordResetLink);

router.post('/reset', resetPassword);

router.put('/update', verifyAuth, changePassword);

module.exports = router;
