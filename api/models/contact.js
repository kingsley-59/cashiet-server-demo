const mongoose = require('mongoose');

const Contact = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	created: { type: Date, default: Date.now },
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: {
		type: String,
		required: true,
		unique: false,
		match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	},
	phoneNumber: { type: Number, required: true },
	message: { type: String, required: true }
});

module.exports = mongoose.model('Contact', Contact);
