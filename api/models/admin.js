const mongoose = require('mongoose');

const AdminSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

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

		password: {
			type: String,
			required: true
		},

		firstName: {
			type: String,
			required: true
		},

		lastName: {
			type: String,
			required: true
		},

		role: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'AdminType'
		},

		lastLogin: {
			type: Date
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Admin', AdminSchema);
