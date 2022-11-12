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

    reference: {
        type: String,
        unique: true,
        required: [true, 'Transaction reference must be provided.']
    },

    response: Object,

    isRecurring: {
        type: Boolean,
        default: false
    }

}, {timestamps: true})


module.exports = mongoose.model('Transactions', Transactions)