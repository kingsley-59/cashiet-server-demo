const express = require('express')
const router = express.Router()

const {
    createOkraCustomer,
    listOkraCustomers,
    saveOkraCustomer
} = require('../controllers/okra')
const requireAuth = require('../middleware/verify-auth')



router.post('/', requireAuth, createOkraCustomer)

router.post('/save/:customer', requireAuth, saveOkraCustomer)

router.post('/list', requireAuth, listOkraCustomers)


module.exports = router