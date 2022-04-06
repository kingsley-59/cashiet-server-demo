const express = require('express');
const router = express.Router();
// const verifyAuth = require("../middleware/verify-auth");
const { getAllSubscribers, subscribeToNewsletter } = require('../controllers/subscriber');

router.get('/', getAllSubscribers);

router.post('/', subscribeToNewsletter);

module.exports = router;
