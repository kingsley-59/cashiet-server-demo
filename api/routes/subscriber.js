const express = require('express');
const router = express.Router();;
const { getAllSubscribers, subscribeToNewsletter, deleteSubscriber } = require('../controllers/subscriber');
const verifyAuth = require('../middleware/verify-auth');

router.get('/', verifyAuth, getAllSubscribers);

router.post('/', subscribeToNewsletter);

router.delete('/:subscriberId', verifyAuth, deleteSubscriber);

module.exports = router;
