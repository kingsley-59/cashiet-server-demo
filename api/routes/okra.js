const express = require('express')
const router = express.Router()

const {
    createOkraCustomer,
    listOkraCustomers
} = require('../controllers/okra')
const requireAuth = require('../middleware/verify-auth')



router.post('/', requireAuth, createOkraCustomer)

router.post('/list', requireAuth, listOkraCustomers)


module.exports = router