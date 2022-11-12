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
    }

}, {timestamps: true})


module.exports = mongoose.model('PaymentDetails', PaymentDetailsSchema)