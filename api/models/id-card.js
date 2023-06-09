const mongoose = require('mongoose');

const IDCardSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		type: {
			type: String,
			required: [true, 'You must specify your id-card type'],
			enum: ['bvn', 'nin', 'driverLicense']
		},

		cardNumber: {
			type: String,
			required: [true, 'You must provide your card number'],
			minLength: [7, 'Enter address in full']
		},

		issueDate: {
			type: Date
		},

		expiryDate: {
			type: Date
		},

		// front: {
		// 	type: String,
		// 	required: [true, 'You must capture the front view of your id card'],
		// },

		// back: {
		// 	type: String,
		// 	required: [true, 'You must capture the rear view of your id card'],
		// },

		verificationStatus: {
			type: Boolean,
			default: false
		},

		response: {
			type: Object
		},

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'You must provide a valid userId']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('IDCard', IDCardSchema);
