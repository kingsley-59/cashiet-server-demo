const mongoose = require('mongoose');

const OrderPaymentSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		amount: {
			type: Number,
			required: true
		},

		paymentOption: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'PaymentOption'
		},

		status: {
			type: Boolean,
			enum: ['awaitingPayment', 'processing', 'paymentComplete'],
			default: ['awaitingPayment']
		},

		order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Order'
		},

		recurringPayment: {
			paymentDuration: {
				type: String
			},

			initialDeposit: {
				type: Number
			},

			recurringAmount: {
				type: Number
			},

			recurringDate: {
				type: Date
			}
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('OrderPayment', OrderPaymentSchema);
