const express = require('express');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');
const { getAllCategories, getCategory, editCategory, deleteCategory, addCategory, deleteAllCategories } = require('../controllers/category');

// add new category
router.post('/', verifyAuth, addCategory);

// get all categories
router.get('/', getAllCategories);

// get specific category details
router.get('/:categoryId', getCategory);
router.get('/:slug', getCategory);

// edit category details
router.put('/:categoryId', verifyAuth, editCategory);

// delete category details
router.delete('/:categoryId', verifyAuth, deleteCategory);

// delete all categories
router.delete('/delete/all', verifyAuth, deleteAllCategories);

module.exports = router;
