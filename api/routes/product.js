const express = require('express');
const {
	addProduct,
	getAllProducts,
	deleteProduct,
	editProduct,
	getProduct,
	getProductsByCategory,
	searchProduct
} = require('../controllers/product');
const router = express.Router();
const { upload } = require('../middleware/multer');

const verifyAuth = require('../middleware/verify-auth');

// get all products
router.get('/', getAllProducts);

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
