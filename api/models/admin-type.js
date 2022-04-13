const mongoose = require('mongoose');

const AdminTypeSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		name: {
			type: String,
			required: true
		},

		permission: {
			type: String,
			enum: ['superadmin'],
            required: true
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('AdminType', AdminTypeSchema);
