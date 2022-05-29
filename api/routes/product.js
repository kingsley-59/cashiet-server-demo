const express = require('express');
const {
	addProduct,
	getAllProducts,
	deleteProduct,
	editProduct,
	getProduct,
	getProductsByCategory,
	searchProduct,
	filterProducts
} = require('../controllers/product');
const router = express.Router();
const { upload } = require('../middleware/multer');
const { paginatedResults } = require('../middleware/pagination');

const verifyAuth = require('../middleware/verify-auth');
const product = require('../models/product');

// get all products
router.get('/', paginatedResults(product), getAllProducts);

// filter all products
router.get('/filter', filterProducts);

// create new product
router.post('/', verifyAuth, upload.single('image'), addProduct);

// get product by categories
router.get('/category/:categoryId', getProductsByCategory);

// get specific product details
router.get('/:productId', getProduct);

// edit product details
router.put('/:productId', verifyAuth, editProduct);

// delete user details
router.delete('/:productId', verifyAuth, deleteProduct);

// search user details
router.get('/search', searchProduct);

module.exports = router;
