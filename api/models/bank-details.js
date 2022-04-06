const mongoose = require('mongoose');

const BankDetailsSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		bankDetails: {
			type: String,
			required: [true, 'You must specify your bank details'],
		},
        
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'You must provide a valid userId']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('BankDetails', BankDetailsSchema);
