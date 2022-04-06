const express = require('express');
const { getAllMessages, sendMessage, deleteMessage } = require('../controllers/contact');
const router = express.Router();
// const verifyAuth = require("../middleware/verify-auth");

router.get('/', getAllMessages);

router.post('/', sendMessage);

router.delete('/:messageId', deleteMessage);

module.exports = router;
