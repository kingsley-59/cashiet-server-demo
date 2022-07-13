const express = require('express');
const {
	getAllRecentlyViewed,
	getUserRecentlyViewed,
	addProductToRecentlyViewed,
	removeProductFromRecentlyViewed,
	removeAllProductsFromRecentlyViewed
} = require('../controllers/recently-viewed');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.get('/', verifyAuth, getAllRecentlyViewed);

router.get('/user', verifyAuth, getUserRecentlyViewed);

router.post('/', verifyAuth, addProductToRecentlyViewed);

router.delete('/remove/:productId', verifyAuth, removeProductFromRecentlyViewed);

router.delete('/', verifyAuth, removeAllProductsFromRecentlyViewed);

module.exports = router;
