const express = require('express');
const { getAllAddresses, postAddress, deleteAddress, updateAddress } = require('../controllers/address');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');

// get all addresses
router.get('/', getAllAddresses);

// create new address
router.post('/', verifyAuth, postAddress);

// update address
router.put('/:addressId', verifyAuth, updateAddress);

// delete user details
router.delete('/:addressId', verifyAuth, deleteAddress);

module.exports = router;
