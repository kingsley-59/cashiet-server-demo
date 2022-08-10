const express = require('express');
const {
	getAllOrders,
	getAllUserOrders,
	createOrder,
	cancelOrder,
	deleteUserOrder,
	getCurrentOrder,
	getSpecificOrder,
	adminGetSpecificOrder,
	adminGetSpecificUserOrders
} = require('../controllers/order');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.get('/', verifyAuth, getAllOrders);

router.get('/user', verifyAuth, getAllUserOrders);

router.get('/:orderId', verifyAuth, getSpecificOrder);

router.get('/admin/user/:userId', verifyAuth, adminGetSpecificUserOrders);

router.get('/admin/:orderId', verifyAuth, adminGetSpecificOrder);

router.get('/pending', verifyAuth, getCurrentOrder);

router.post('/', verifyAuth, createOrder);

router.post('/:orderId', verifyAuth, cancelOrder);

router.delete('/:orderId', verifyAuth, deleteUserOrder);

module.exports = router;
