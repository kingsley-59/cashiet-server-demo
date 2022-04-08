const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		totalAmount: {
			type: Number
		},

		orderDate: {
			type: Date,
			required: [true, 'Specify the order date']
		},

		status: {
			type: Boolean,
			enum: ['awaitingPayment', 'processing', 'paymentComplete'],
			default: ['awaitingPayment']
		},

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
