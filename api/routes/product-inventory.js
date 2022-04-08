const express = require('express');
const { getInventories, addInventory, getSpecificInventory, updateInventory, deleteInventory } = require('../controllers/product-inventory');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');

// get all inventories
router.get('/', verifyAuth, getInventories);

// add new inventory
router.post('/', verifyAuth, addInventory);

// get specific inventory
router.get('/:inventoryId', verifyAuth, getSpecificInventory);

// edit inventory
router.put('/:inventoryId', verifyAuth, updateInventory);

// delete inventory
router.delete('/:inventoryId', verifyAuth, deleteInventory);

module.exports = router;
