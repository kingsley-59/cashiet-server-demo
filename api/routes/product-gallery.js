const express = require('express');
const {  addProductGallery, getProductCategoryById, deleteProductGallery, getAllProductGallery } = require('../controllers/product-gallery');
const router = express.Router();
const { upload } = require('../middleware/multer');

const verifyAuth = require('../middleware/verify-auth');

// get all products gallery
router.get('/', getAllProductGallery);

// create new product gallery
router.post('/', verifyAuth, upload.array('images'), addProductGallery);

// get specific product details
router.get('/:productId', getProductCategoryById);

// edit product gallery
// router.put('/:productId', verifyAuth, editProduct);

// delete product gallery
router.delete('/:productId', verifyAuth,  deleteProductGallery);

module.exports = router;
