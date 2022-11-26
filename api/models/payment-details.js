const mongoose = require('mongoose')


const PaymentDetailsSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User id is required.'],
    },

    authorization: {
        type: Object
    },

    customer: {
        type: Object
    },

    reference: {
        type: String
    },

    isRefunded: {
        type: Boolean,
        default: false
    }

}, {timestamps: true})


module.exports = mongoose.model('PaymentDetails', PaymentDetailsSchema)