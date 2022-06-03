const express = require('express');
const { oauthRegistration } = require('../controllers/oauth');
const router = express.Router();

router.post('/', oauthRegistration);

module.exports = router;
