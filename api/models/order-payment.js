const mongoose = require('mongoose');

const OrderPaymentSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		amount: {
			type: Number,
			required: true
		},

		paymentOption: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('OrderPayment', OrderPaymentSchema);
