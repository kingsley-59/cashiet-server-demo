const mongoose = require('mongoose');

const TransactionSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		details: {
			type: String,
			required: true
		},

		invoice: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Invoice'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
