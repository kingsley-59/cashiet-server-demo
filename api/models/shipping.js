const mongoose = require('mongoose');

const ShippingSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		deliveryAddress: Object,

		shippingFee: {
			type: Number
		},

		deliveryDate: {
			type: Date
		},

		status: {
			type: String | Boolean
		},

		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Shipping', ShippingSchema);
