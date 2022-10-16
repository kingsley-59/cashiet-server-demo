const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		name: {
			type: String,
			unique: [true, 'Product name has to be unique'],
			required: [true, 'Specify product name']
		},

		slug: {
			type: String,
			unique: true,
			required: true
		},

		sku: {
			type: String,
			unique: true,
			required: true
		},

		price: {
			type: Number,
			required: [true, 'Specify the price of the product']
		},

		keywords: {
			type: Array,
			default: [],
			required: true
		},

		quantity: {
			type: Number,
			default: 1
		},

		quantitySold: {
			type: Number,
			default: 0
		},

		description: {
			type: String,
			required: [true, 'Enter image description']
		},

		weight: {
			type: Number
		},

		dimension: {
			width: {
				type: Number
			},
			height: {
				type: Number
			},
			length: {
				type: Number
			}
		},

		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Category',
			required: [true, 'Enter the category id']
		},

		gallery: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'ProductGallery',
			default: null
		},

		subCategoryOne: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SubCategoryOne'
		},

		subCategoryTwo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SubCategoryTwo'
		},

		image: {
			url: {
				type: String,
				required: true
			},
			contentType: String
		},

		availablePaymentOptions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'PaymentOptions',
				// unique: true,
				default: null,
				required: [true, 'Add the available payment options']
			}
		],

		ratings: [
			{
				title: {
					type: String
				},

				comment: {
					type: String,
					required: true
				},

				user: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User'
				}
			}
		],

		discount: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Discount'
		},

		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Supply the id of the admin creating the category']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
