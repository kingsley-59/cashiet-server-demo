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

		price: {
			type: Number,
			required: [true, 'Specify the price of the product']
		},

		keywords: {
			type: Array,
			default: []
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
				type: Number,
				required: true
			},
			height: {
				type: Number,
				required: true
			},
			length: {
				type: Number,
				required: true
			}
		},

		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Category',
			required: [true, 'Enter the category id']
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
				required: [true, 'Upload the available payment options']
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
