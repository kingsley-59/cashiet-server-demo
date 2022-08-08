const mongoose = require('mongoose');

const PaymentOptionsSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		type: {
			type: String,
            enum: ["save_and_buy_later", "pay_later", "buy_now"],
			required: [true, 'Name of payment options required'],
		},

		description: {
			type: String,
			required: [true, 'You must specify payment description'],
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('PaymentOptions', PaymentOptionsSchema);
