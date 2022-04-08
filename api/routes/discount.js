const express = require('express');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');
const { getAllDiscounts, addNewDiscount, getSpecificDiscount, updateDiscount, deleteDiscount } = require('../controllers/discount');

// get all discounts
router.get('/', verifyAuth, getAllDiscounts);

// add new discount
router.post('/', verifyAuth, addNewDiscount);

// get specific discount
router.get('/:discountId', verifyAuth, getSpecificDiscount);

// edit discount
router.put('/:cardId', verifyAuth, updateDiscount);

// delete discount
router.delete('/:cardId', verifyAuth, deleteDiscount);

module.exports = router;
