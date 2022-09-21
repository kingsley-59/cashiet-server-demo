const express = require('express')
const router = express.Router()

const requireAuth = require('../middleware/verify-auth')
const getAuthorizationToken = require('../middleware/getAuthorizationToken')
const { verifyUserAccount } = require('../controllers/indicina')


router.post('/', requireAuth, getAuthorizationToken, verifyUserAccount)


module.exports = router