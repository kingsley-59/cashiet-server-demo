const mongoose = require('mongoose')

const Transactions = mongoose.Schema({
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
		ref: 'Invoice'
    },

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
    },

    success: {
        type: Boolean,
        default: true
    },

    reference: {
        type: String,
    },

    response: Object,

    isRecurring: {
        type: Boolean,
        default: false
    }

}, {timestamps: true})


module.exports = mongoose.model('Transactions', Transactions)