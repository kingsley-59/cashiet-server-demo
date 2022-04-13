const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		totalAmount: {
			type: Number,
			default: 0
		},

		orderDate: {
			type: Date,
			required: [true, 'Specify the order date']
		},

		status: {
			type: String,
			enum: ['Not processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], // enum means string objects
			default: 'Not processed'
		},

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
