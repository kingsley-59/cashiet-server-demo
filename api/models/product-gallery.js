const mongoose = require('mongoose');

const ProductGallerySchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		images: [Object],

		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('ProductGallery', ProductGallerySchema);
