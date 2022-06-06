const mongoose = require('mongoose');

const PartnerSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,

	fullName: {
		type: String,
		required: [true, 'Specify the partner full name']
	},

	email: {
		type: String,
		required: [true, 'You must provide an email'],
		match: [
			/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
			'Enter a valid email address'
		],
		unique: true,
		lowerCase: true
	},

	phoneNumber: {
		type: Number,
		required: [true, 'You must provide a valid phone number']
	},

	message: {
		type: String,
		required: [true, 'Specify the reason for partnering']
	}
});

module.exports = mongoose.model('Partner', PartnerSchema);
