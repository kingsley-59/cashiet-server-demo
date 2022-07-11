const express = require('express');
const { getAllWishList, getUserWishList, removeProductFromWishList, addProductToWishList, deleteWishList } = require('../controllers/wishlist');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.get('/', verifyAuth, getAllWishList);

router.get('/user', verifyAuth, getUserWishList);

router.delete('/remove/:productId', verifyAuth, removeProductFromWishList);

router.post('/', verifyAuth, addProductToWishList);

router.delete('/:wishlistId', verifyAuth, deleteWishList);

module.exports = router;
