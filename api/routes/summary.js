const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/verify-auth');
const {
    getProductStats
} = require('../controllers/summary')


router.get('/', verifyAuth, getProductStats)


module.exports = router