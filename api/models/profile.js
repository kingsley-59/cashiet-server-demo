const mongoose = require('mongoose');

const ProfileSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		firstName: {
			type: String,
			minLength: [2, 'First name must have at least 2 characters'],
			required: [true, 'You must provide your first name']
		},

		middleName: {
			type: String,
			minLength: [2, 'Middle Name must have at least 2 characters']
		},

		lastName: {
			type: String,
			minLength: [2, 'Last name must have at least 2 characters'],
			required: [true, 'You must provide your last name']
		},

		gender: {
			type: String,
			enum: ['male', 'female'],
			// required: [true, 'You must provide your gender details']
		},

		profilePicture: {
			type: String,
			// required: [true, 'You must provide your profile picture']
		},

		nationality: {
			type: String,
			// required: [true, 'You must provide your nationality status']
		},

		dob: {
			type: Date,
			// required: [true, 'You must provide your date of birth']
		},

		phoneNumber: {
			type: Number || String,
			// required: [true, 'You must provide a valid phone number']
		},

		address: {
			type: String,
			// required: [true, 'You must provide a valid address']
		},

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'You must provide a valid userId']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Profile', ProfileSchema);
