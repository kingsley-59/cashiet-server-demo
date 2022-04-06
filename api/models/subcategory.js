const mongoose = require('mongoose');

const SubCategoryOneSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		name: {
			type: String,
			unique,
			required: [true, 'Category name must be included'],
			min: [3, 'Category Name should not be less than 3 characters']
		},

		slug: {
			type: String
		},

		description: {
			type: String,
			// required: [true, 'Category description must be included'],
			min: [10, 'Category Description should not be less than 10 characters']
		},

		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Category',
			required: true
		},

		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Supply the id of the admin creating the category']
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('SubCategoryOne', SubCategoryOneSchema);
