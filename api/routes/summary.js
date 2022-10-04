const express = require('express')
const router = express.Router()
const verifyAuth = require('../middleware/verify-auth');
const {
    adminDashboardSummary,
    userDashboardSummary
} = require('../controllers/summary')


router.get('/admin', verifyAuth, adminDashboardSummary)

router.get('/', verifyAuth, userDashboardSummary)


module.exports = router