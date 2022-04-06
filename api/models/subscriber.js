const mongoose = require('mongoose');

const SubscriberSchema = mongoose.Schema({
	_id: mongoose.Schema.Types.ObjectId,
	created: { type: Date, default: Date.now },
	email: {
		type: String,
		required: true,
		unique: true,
		match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	}
});

module.exports = mongoose.model('Subscriber', SubscriberSchema);
