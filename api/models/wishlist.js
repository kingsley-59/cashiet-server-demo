const mongoose = require('mongoose');

const WishListSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		productItems: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Product',
					required: true
				}
			}
		]
	},
	{ timestamps: true }
);

module.exports = mongoose.model('WishList', WishListSchema);
