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
const { validateUserInput } = require('../middleware/validateFields');
// const { validateUserInput } = require('../middleware/validateFields');
const verifyAuth = require('../middleware/verify-auth');
const product = require('../models/product');
const productSchema = require('../schema/product');

// get all products
router.get(
	'/',
	paginatedResults(
		product,
		{ path: 'category', select: 'name' },
		'name slug price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings'
	),
	validateUserInput(productSchema.filterProduct, (params = true)),
	getAllProducts
);

// filter all products
router.get('/filter', filterProducts);

// create new product
router.post('/', verifyAuth, upload.single('image'), validateUserInput(productSchema.addProduct), addProduct);

// get product by categories
router.get('/category/:categoryId', getProductsByCategory);

// search user details
router.get('/search', searchProduct);

// get specific product details
router.get('/:productId', validateUserInput(productSchema.validateProductId, (params = true)), getProduct);

// edit product details
router.put('/:productId', verifyAuth, validateUserInput(productSchema.validateProductId, (params = true)), editProduct);

// delete user details
router.delete('/:productId', validateUserInput(productSchema.validateProductId, (params = true)), verifyAuth, deleteProduct);



module.exports = router;
