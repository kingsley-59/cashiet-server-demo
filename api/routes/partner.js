const express = require('express');
const { getAllPartners, createPartner, deletePartner, getSinglePartner } = require('../controllers/partner');
const router = express.Router();
const verifyAuth = require('../middleware/verify-auth');

router.get('/', verifyAuth, getAllPartners);

router.get('/:partnerId', verifyAuth, getSinglePartner);

router.post('/', createPartner);

router.delete('/:partnerId', verifyAuth, deletePartner);

module.exports = router;
