const mongoose = require('mongoose');

const UserSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		// userName: {
		// 	type: String,
		// 	minLength: [5, 'Full name must have at least 5 characters']
		// },

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
			enum: ['user', 'admin', 'merchant'],
			default: 'user'
		},

		isVerified: {
			type: Boolean,
			default: false
		},

		password: {
			type: String,
			required: [true, 'password is required'],
			minLength: [8, 'Password must contain at least 8 characters']
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
