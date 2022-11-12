const axios = require('axios')

const BASE_URL = 'https://api.paystack.co'
const SECRET_KEY = process.env.PAYSTACK_TEST_SECRET


async function verifyTransactionGetToken(reference) {
    const path = `/transaction/verify/${reference}`

    let res = await axios.get(`${BASE_URL + path}`, {
        headers: {
            Authorization: `Bearer ${SECRET_KEY}`
        }
    })
    if (res.status !== 200) throw new Error(res.error?.message ?? "Failed to fetch verification data from paystack")

    let data = res.data?.data
    let authorization = data?.authorization
    let customer = data?.customer

    return { authorization, customer, data }
}

async function chargeAuthorization(email, amount, authorization_code) {
    const path = `/transaction/charge_authorization`

    let res = await axios.post(`${BASE_URL + path}`, { email, amount, authorization_code }, {
        headers: {
            Authorization: `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    })
    if (res.status !== 200) throw new Error(res.error?.message ?? "Failed to charge customer authorization from paystack")

    return { data: res.data }
}

/**
 * 
 * @param {String} name 
 * @param {String} interval ['hourly', 'daily', 'weekly', 'monthly', 'quaterly', 'annually']
 * @param {String | Number} amount 
 * @param {Number} invoice_limit 
 * @returns 
 */
async function createPlan(name, interval, amount, invoice_limit) {
    const path = `/plan`

    let res = await axios.post(`${BASE_URL + path}`, { name, interval, amount, invoice_limit }, {
        headers: {
            Authorization: `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    })
    if (res.status !== 200) throw new Error(res.error?.message ?? "Failed to charge customer authorization from paystack")

    return { data: res.data }
}

async function createSubscription(customer_email, plan, authorization, start_date) {
    const path = `/subscription`

    let res = await axios.post(`${BASE_URL + path}`, { customer: customer_email, plan, authorization, start_date }, {
        headers: {
            Authorization: `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    })
    if (res.status !== 200) throw new Error(res.error?.message ?? "Failed to charge customer authorization from paystack")

    return { data: res.data }
}

async function addPlanToTransactions(email, amount, plan) {
    const path = `/transaction/initialize`

    let res = await axios.post(`${BASE_URL + path}`, { email, amount, plan }, {
        headers: {
            Authorization: `Bearer ${SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    })
    if (res.status !== 200) throw new Error(res.error?.message ?? "Failed to charge customer authorization from paystack")

    return { data: res.data }
}


module.exports = {
    getAuthorizationToken: verifyTransactionGetToken,
    verifyTransactionGetToken,
    chargeAuthorization,
    createPlan,
    createSubscription,
    addPlanToTransactions
}