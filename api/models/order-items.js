const mongoose = require('mongoose');

const OrderItemsSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		quantity: {
			type: Number
		},

		unitPrice: {
			type: Number
		},

		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product'
		},

		discount: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Discount'
		},

		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('OrderItems', OrderItemsSchema);
