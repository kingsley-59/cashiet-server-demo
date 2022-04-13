const express = require('express');
const { getAllOrderItems, addItemToNewOrder, addItemsToNewOrder, updateOrderItem, deleteOrderItem } = require('../controllers/order-item');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');

// get all order items
router.get('/', getAllOrderItems);

// create new order item
router.post('/single', verifyAuth, addItemToNewOrder);

// create new order items
router.post('/multiple', verifyAuth, addItemsToNewOrder);

// add item to previous order
router.post('/previous-order/:orderId', verifyAuth, addItemsToNewOrder);

// update specific product details
router.post('/:productId', updateOrderItem);

// delete order item
router.delete('/:productId', verifyAuth, deleteOrderItem);

module.exports = router;
