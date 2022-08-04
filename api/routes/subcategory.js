const express = require('express');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');
// const { getAllCategories, getCategory, editCategory, deleteCategory, addCategory, deleteAllCategories } = require('../controllers/category');
const { addSubcategory, getAllSubcategories, getSingleCategory, editSubcategory, deleteSubcategory } = require('../controllers/subCategory');

// add new subcategory
router.post('/', verifyAuth, addSubcategory);

// get all categories
router.get('/', getAllSubcategories);

// get specific category details
router.get('/:categoryId', getSingleCategory);
router.get('/:slug', getSingleCategory);

// edit category details
router.put('/:categoryId', verifyAuth, editSubcategory);

// delete category details
router.delete('/:categoryId', verifyAuth, deleteSubcategory);

// delete all categories
// router.delete('/delete/all', verifyAuth, deleteAllCategories);

module.exports = router;
