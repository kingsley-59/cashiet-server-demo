const express = require('express');
const { getAllMessages, sendMessage, getCurrentUserMessages, deleteMessage } = require('../controllers/support');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');

// get all messages
router.get('/', verifyAuth, getAllMessages);

// create new message
router.post('/', verifyAuth, sendMessage);

// get user message
router.get('/user', verifyAuth, getCurrentUserMessages);

// delete message details
router.delete('/:messageId', verifyAuth, deleteMessage);

module.exports = router;
