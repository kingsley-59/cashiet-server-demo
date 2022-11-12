const mongoose = require('mongoose');

const RecurringCharges = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		startDate: {
			type: Date,
			required: true
		},

		endDate: {
			type: Date,
			required: true
		},

		duration: {
			type: Number,
			default: 0,
			required: true
		},

		splitAmount: {
			type: Number
		},

		isActive: {
			type: Boolean,
			default: false
		},

		paymentDetails: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'PaymentDetails'
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model('RecurringCharges', RecurringCharges);
