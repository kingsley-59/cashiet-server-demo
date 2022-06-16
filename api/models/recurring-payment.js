const mongoose = require('mongoose');

const RecurringPayment = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		payerBankCode: {
			type: String,
			required: true
		},

		payerAccountNumber: {
			type: String,
			required: true
		},

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

		requestId: {
			type: String
		},

		mandateId: {
			type: String
		},

		isActive: {
			type: Boolean,
			default: false
		},

		remitaTransRef: {
			type: String
		},

		// user: {
		// 	type: mongoose.Schema.Types.ObjectId,
		// 	ref: 'User'
		// },

		profile: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Profile'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('RecurringPayment', RecurringPayment);
