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
		transactionId: { type: String },
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
		}

		// reference: {
		// 	type: String,
		// 	required: true
		// },

		// transactionDetails: {
		// 	domain: {
		// 		type: String,
		// 		required: true
		// 	},

		// 	status: {
		// 		type: String,
		// 		required: true
		// 	},

		// 	reference: {
		// 		type: String,
		// 		required: true
		// 	},

		// 	amount: {
		// 		type: Number,
		// 		required: true
		// 	},

		// 	message: {
		// 		type: String,
		// 	},

		// 	gateway_response: {
		// 		type: String,
		// 		required: true
		// 	},

		// 	paid_at: {
		// 		type: Date,
		// 		required: true
		// 	},

		// 	created_at: {
		// 		type: Date,
		// 		required: true
		// 	},
		// 	channel: {
		// 		type: String,
		// 		required: true
		// 	},

		// 	currency: {
		// 		type: String,
		// 		required: true
		// 	},

		// 	ip_address: {
		// 		type: String,
		// 		required: true
		// 	}
		// }
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
