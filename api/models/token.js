const mongoose = require('mongoose');

const TokenSchema = mongoose.Schema(
	{
		_userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
		token: { type: String, required: true },
		createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
	},
	{ timeStamps: true }
);

module.exports = mongoose.model('Token', TokenSchema);
