const mongoose = require('mongoose')
const OkraCustomer = require('../models/okra')
const Profile = require('../models/profile')
const axios = require('axios')
const bcrypt = require('bcrypt')
require('dotenv').config()


const createOkraCustomer = async (req, res, next) => {
    const authenticatedUser = req.decoded.user
    
    const {
        noOfAccount,
        name,
        bank,
        username,
        password,
        type,
        volume,
        identity,
        internetSpeed
    } = req.body

    try {
        [noOfAccount, name, bank, username, password, type, volume, identity, internetSpeed].forEach(item => {
            if (item == '' || item == null || item == undefined) {
                throw new Error(`All credentials/fields are required! `)
            }
        });
    } catch (error) {
        // console.log(error.message)
        res.status(400).json({message: error.message})
        return;
    }

    try {
        const response = await axios.post(
            'https://api.okra.ng/v2/sandbox/customers/create',
            [{
                noOfAccount, name, bank, username, password, type, volume, identity, internetSpeed
            }],
            {
                headers: {
                    Authorization: `Bearer ${process.env.OKRA_SECRET_API_KEY}`
                }
            }
        )
        if (response.status === 200) {
            let { data } = response

            if (data.status !== "success") {
                res.status(400).json({message: data?.message ?? 'An error occurred while creating customer'})
                return ;
            }

            const customer = data?.data?.customers[0]
            const customerPswdHash = await bcrypt.hash(customer.account.password, 10)
            const okracustomer = new OkraCustomer({
                _id: new mongoose.Types.ObjectId(),
                user: authenticatedUser._id,
                okra_id: customer._id,
                customer: customer.customer,
                phone: customer.identity.phone[0],
                score: customer.identity.score,
                type: customer.identity.type,
                photo_url: customer.identity.photo_id[0].url,
                firstname: customer.identity.firstname,
                lastname: customer.identity.lastname,
                email: customer.identity.email[0],
                username: customer.account.username,
                password: customerPswdHash,
                nuban: customer.account.nuban[0],
                volume: customer.account.volume,
                speed: customer.account.speed,
                created_at: customer.created_at,
            })
            const saveNewCustomer = await okracustomer.save()
            res.status(201).json({message: 'Customer created successfully', data: saveNewCustomer})
        } else {
            res.status(response.status).send({message: 'Request was unsuccessful!'})
        }
    } catch (error) {
        let { response } = error
        // console.log(response?.data ?? error.message)
        res.status(500).json({message: response?.data?.message ?? 'Unable to create okra customer'})
    }

}


const saveOkraCustomer = async (req, res) => {
    const authenticatedUser = req.decoded.user
    
    const customerId = req.params.customer

    if (!customerId) return res.status(400).json({message: 'customer id is required.'})

    try {
        const result = await OkraCustomer.find({customer: customerId}).exec()
        if (result && result?.length > 0) {
            return res.status(403).json({message: 'customer already exists.'})
        }

        const response = await axios.post(
            'https://api.okra.ng/v2/sandbox/customers/get',
            { customer: customerId },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OKRA_SECRET_API_KEY}`
                }
            }
        )
        if (response.status === 200) {
            let { data } = response

            if (data.status !== "success") {
                res.status(400).json({message: data?.message ?? 'An error occurred while verifying customer'})
                return ;
            }

            const customer = data?.data?.customer
            const customerPswdHash = await bcrypt.hash(customer.account.password, 10)
            const okracustomer = new OkraCustomer({
                _id: new mongoose.Types.ObjectId(),
                user: authenticatedUser._id,
                okra_id: customer._id,
                customer: customer.customer,
                phone: customer.identity.phone[0],
                score: customer.identity.score,
                type: customer.identity.type,
                photo_url: customer.identity.photo_id[0].url,
                firstname: customer.identity.firstname,
                lastname: customer.identity.lastname,
                email: customer.identity.email[0],
                username: customer.account.username,
                password: customerPswdHash,
                nuban: customer.account.nuban[0],
                volume: customer.account.volume,
                speed: customer.account.speed,
                created_at: customer.created_at,
            })
            const saveNewCustomer = await okracustomer.save()
            res.status(201).json({message: 'Customer created successfully', data: saveNewCustomer})
        } else {
            res.status(response.status).send({message: 'Request was unsuccessful!'})
        }
    } catch (error) {
        console.log(error)
        let { response } = error
        // console.log(response?.data ?? error.message)
        res.status(500).json({message: response?.data?.message ?? 'Unable to verify okra customer'})
    }
 
}


const listOkraCustomers = async (req, res, next) => {
    const authenticatedUser = req.decoded.user

    if (authenticatedUser?.role !== 'superadmin' || authenticatedUser?.role !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized access', status: 401 });
    } 

    try {
        const okraCustomers = await OkraCustomer.find({}).select(
            'user okra_id cus tomer phone score type photo_url firstname lastname email username nuban volume created_at'
        ).exec()
        if (okraCustomers) {
            res.status(200).json({message: 'Request was successful!', data: okraCustomers})
            return;
        }
    } catch (error) {
        let { response } = error
        // console.log(response?.data ?? error?.message)
        res.status(500).json({message: 'Failed to get all okra customers'})
    }
}


module.exports = {
    createOkraCustomer,
    saveOkraCustomer,
    listOkraCustomers,
}