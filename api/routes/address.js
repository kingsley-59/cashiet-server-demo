const express = require('express');
const { getAllAddresses, postAddress, deleteAddress, updateAddress, getUserAddresses } = require('../controllers/address');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');

// get all addresses
router.get('/', verifyAuth, getAllAddresses);

// get all user addresses
router.get('/me', verifyAuth, getUserAddresses);

// create new address
router.post('/', verifyAuth, postAddress);

// update address
router.put('/:addressId', verifyAuth, updateAddress);

// delete user address
router.delete('/:addressId', verifyAuth, deleteAddress);

module.exports = router;
