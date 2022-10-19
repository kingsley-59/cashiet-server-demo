const mongoose = require('mongoose')


const okraCustomerSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'You must provide a valid userId'],
        },

        okra_id: {
            type: String,
            required: true
        },

        customer: {
            type: String,
            required: true
        },

        accountId: {
            type: String,
            required: true
        },

        recordId: {
            type: String
        },

        lastBalance: String,

        phone: {
            type: String
        },

        score: Number,

        type: String,

        photo_url: String,

        firstname: {
            type: String,
        },

        lastname: {
            type: String,
        },

        email: {
            type: String,
        },

        username: {
            type: String,
        },

        password: String,

        nuban: String,
        
        bank_id: String,

        bank: String,

        volume: String,

        speed: Number,

        created_at: {
            type: String,
            default: Date.now(),
        },
        
    },
    { timestamp: true }
)


module.exports = mongoose.model('OkraCustomer', okraCustomerSchema)