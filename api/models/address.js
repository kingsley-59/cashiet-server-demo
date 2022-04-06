const mongoose = require('mongoose');

const AddressSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		addressLine1: {
			type: String,
			required: [true, 'You must provide your primary address'],
			minLength: [7, 'Enter address in full']
		},

		addressLine2: {
			type: String,
			minLength: [7, 'Enter address in full']
		},

		city: {
			type: String,
			required: [true, 'You must provide your city'],
			minLength: [2, 'City Name must have at least 2 characters']
		},

		state: {
			type: String,
			required: [true, 'You must provide your state'],
			minLength: [2, 'State Name must have at least 2 characters']
		},

		zip: {
			type: String,
			required: [true, 'You must provide your zip'],
			minLength: [2, 'Zip Name must have at least 2 characters']
		},

		country: {
			type: String,
			required: [true, 'You must provide your country'],
			minLength: [2, 'Country Name must have at least 2 characters']
		},

		phoneNumber: {
			type: Number,
			required: [true, 'You must provide your valid phone number'],
			minLength: [11, 'Phone Number Name must have at least 2 characters']
		},

		alternativePhoneNumber: {
			type: Number
		},

		email: {
			type: String,
			match: [
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
				'Enter a valid email address'
			]
		},
		
		alternativeEmail: {
			type: String,
			match: [
				/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
				'Enter a valid email address'
			]
		},

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'You must provide a valid userId']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Address', AddressSchema);
