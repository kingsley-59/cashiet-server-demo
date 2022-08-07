const mongoose = require('mongoose');

const WishListSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		products: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Product',
				required: true,
				unique: true
			}
		],

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('WishList', WishListSchema);
