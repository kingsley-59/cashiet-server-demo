const express = require('express');
const router = express.Router();
const { getAllSubscribers, subscribeToNewsletter, deleteSubscriber } = require('../controllers/subscriber');
const verifyAuth = require('../middleware/verify-auth');
const { validateUserInput } = require('../middleware/validateFields');
const commonSchema = require('../schema/general');

router.get('/', verifyAuth, getAllSubscribers);

router.post('/', validateUserInput(commonSchema.validateEmail), subscribeToNewsletter);

router.delete('/:subscriberId', verifyAuth, deleteSubscriber);

module.exports = router;
