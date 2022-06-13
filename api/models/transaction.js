const mongoose = require('mongoose');

const TransactionSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		invoice: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Invoice'
		},

		// order: {
		// 	type: mongoose.Schema.Types.ObjectId,
		// 	ref: 'Order'
		// },

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},

		status: {
			type: String | null
		},
		transactionId: { type: String | Number },
		responseCode: { type: String | null },
		responseMsg: { type: String | null },
		iResponseCode: { type: Number | null },
		iResponseMessage: { type: String | null },
		appVersionCode: { type: Number },
		responseData: {
			paymentReference: { type: String },
			amount: { type: Number },
			paymentState: { type: String },
			paymentDate: { type: Date },
			processorId: { type: String },
			transactionId: { type: String },
			tokenized: { type: Boolean },
			paymentToken: { type: String | null },
			cardType: { type: String | null },
			debitedAmount: { type: String },
			message: { type: String },
			paymentChannel: { type: String | null },
			customerId: { type: String },
			firstName: { type: String },
			lastName: { type: String },
			phoneNumber: { type: String | Number },
			email: { type: String },
			narration: { type: String }
		},
		data: {
			type: Object | String | null
		},

		transactionRef: {
			type: Number
		},

		statuscode: {
			type: String
		},

		RRR: {
			type: String
		},

		requestId: {
			type: String
		},

		mandateId: {
			type: String
		},

		transactionRef: {
			type: String
		},

		recurringPayment: {
			type: Boolean,
			default: false
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
