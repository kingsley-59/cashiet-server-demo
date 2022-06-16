const express = require('express');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');
const {
	getAllCards,
	addCard,
	verifyCard,
	disableCard,
	getSpecificCard,
	updateCard,
	deleteCard,
	getUserCard,
	testCardVerification
} = require('../controllers/id-card');

// get all users id cards
router.get('/', verifyAuth, getAllCards);

// add new card
router.post('/', verifyAuth, addCard);

// verify card
router.put('/verify/:cardId', verifyAuth, verifyCard);

// disable card
router.put('/disable/:cardId', verifyAuth, disableCard);

// get user card
router.get('/user', verifyAuth, getUserCard);

// get specific card
router.get('/:cardId', verifyAuth, getSpecificCard);

// edit user card
router.put('/:cardId', verifyAuth, updateCard);

// edit user card
router.post('/test-card', verifyAuth, testCardVerification);

// delete user card
router.delete('/:cardId', verifyAuth, deleteCard);

module.exports = router;
