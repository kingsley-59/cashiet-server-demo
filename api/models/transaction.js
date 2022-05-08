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

		transactionDetails: {
			// id: {
			// 	type: String,
			// 	required: true
			// },
			domain: {
				type: String,
				required: true
			},

			status: {
				type: String,
				required: true
			},

			reference: {
				type: String,
				required: true
			},

			amount: {
				type: Number,
				required: true
			},

			message: {
				type: String,
			},

			gateway_response: {
				type: String,
				required: true
			},

			paid_at: {
				type: Date,
				required: true
			},

			created_at: {
				type: Date,
				required: true
			},
			channel: {
				type: String,
				required: true
			},

			currency: {
				type: String,
				required: true
			},
			
			ip_address: {
				type: String,
				required: true
			}
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
