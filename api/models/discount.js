const mongoose = require('mongoose');

const DiscountSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		name: {
			type: String,
			required: [true, 'Specify discount name']
		},

		description: {
			type: String,
			required: [true, 'Specify details about the discount']
		},

		descriptionPercent: {
			type: Number,
			min: [5, 'Discount should not be less than 5%'],
			max: [99, 'Discount should not be more than 99%']
		},

		active: {
			type: Boolean,
			default: false
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Discount', DiscountSchema);
