const mongoose = require('mongoose');

const SupportSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,

	fullName: {
		type: String,
		required: [true, 'Full name is required'],
		minLength: [6, 'Full name must contain at least 8 characters']
	},

	message: {
		type: String,
		required: [true, 'Message is required'],
		minLength: [6, 'Message must contain at least 8 characters']
	},

	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'You must provide a valid userId']
	}
});

module.exports = mongoose.model('Support', SupportSchema);
