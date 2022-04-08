const mongoose = require('mongoose');

const ProductInventorySchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		quantity: {
			type: Number,
			required: [true, 'Specify product quantity']
		},

		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('ProductInventory', ProductInventorySchema);
