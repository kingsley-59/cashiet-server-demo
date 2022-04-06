const mongoose = require('mongoose');

const PaymentDetailsSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		cardDetails: {
			type: String,
			required: [true, 'You must specify your card details'],
		},
        
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'You must provide a valid userId']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('PaymentDetails', PaymentDetailsSchema);
