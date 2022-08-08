const mongoose = require('mongoose');

const UserSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		username: {
			type: String,
			minLength: [3, 'Full name must have at least 3 characters'],
			unique: true,
			required: [true, 'You must provide your username']
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

		role: {
			type: String,
			enum: ['user', 'admin', 'superadmin'],
			default: 'user'
		},

		isVerified: {
			type: Boolean,
			default: false
		},

		isRevoked: {
			type: Boolean,
			default: false
		},

		modeOfRegistration: {
			type: String,
			default: 'manual'
		},

		password: {
			type: String,
			required: [true, 'password is required'],
			minLength: [7, 'Password must contain at least 7 characters']
		},

		// idVerification : { type: Boolean, default: false },

		passwordResetToken: String,

		passwordResetExpires: Date,

		passwordChangedAt: Date
	},
	{
		timestamps: true
	}
);

module.exports = mongoose.model('User', UserSchema);
