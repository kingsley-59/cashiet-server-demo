const mongoose = require('mongoose');

const InvoiceSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		amount: {
			type: Number,
			required: true
		},

		dateIssued: {
			type: Date
		},

		expiryDate: {
			type: Date
		},

		status: {
			type: String
		},

		orderPayment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'OrderPayment'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
