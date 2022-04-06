const mongoose = require('mongoose');

const CategorySchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		name: {
			type: String,
			unique: true,
			required: [true, 'Category name must be included'],
			min: [3, 'Category Name should not be less than 3 characters'],
			lowerCase: true
		},

		slug: {
			type: String
		},

		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Supply the id of the admin creating the category']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Category', CategorySchema);
