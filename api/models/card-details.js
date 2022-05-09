const mongoose = require('mongoose');

const CardDetailsSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		// cardDetails: {
		// 	type: String,
		// 	required: [true, 'You must specify your card details']
		// },

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'You must provide a valid userId']
		},

		authorization_code: {
			type: String,
			required: true
		},

		card_type: {
			type: String,
			required: true
		},

		bin: {
			type: String,
			required: true
		},

		last4: {
			type: Number,
			required: true
		},

		exp_month: {
			type: Number,
			required: true
		},

		exp_year: {
			type: Number,
			required: true
		},

		channel: {
			type: String,
			required: true
		},

		card_type: {
			type: String,
			required: true
		},

		bank: {
			type: String,
			required: true
		},

		country_code: {
			type: String,
			required: true
		},

		brand: {
			type: String,
			required: true
		},

		reusable: {
			type: Boolean,
			required: true
		},

		signature: {
			type: String,
			required: true
		},

		account_name: {
			type: String | null
		},

		customer: {
			id: {
				type: String | null
			},

			customer_code: {
				type: String | null
			},

			first_name: {
				type: String | null
			},

			last_name: {
				type: String | null
			},

			email: {
				type: String | null
			}
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('CardDetails', CardDetailsSchema);
