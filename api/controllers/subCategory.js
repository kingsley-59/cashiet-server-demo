const mongoose = require('mongoose');
const SubCategory = require('../models/subcategory');
const slugify = require('slugify');
const category = require('../models/category');

const addSubcategory = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	const findCategory = await category.findOne({ _id: req.body?.category });
	if (!findCategory) {
		return res.status(200).json({ message: 'Category does not exist', status: 200 });
	}

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		SubCategory.find({ name: req.body?.name })
			.exec()
			.then(category => {
				if (category?.length >= 1) {
					return res.status(409).json({ message: 'Sub category already exist' });
				} else {
					try {
						console.log(req.body);
						const newCategory = new SubCategory({
							_id: new mongoose.Types.ObjectId(),
							name: req.body?.name,
							slug: slugify(req.body?.name),
							description: req.body?.description || '',
							category: req.body?.category,
							createdBy: authenticatedUser._id
						});
						console.log(newCategory);

						return newCategory
							.save()
							.then(category => {
								return category
									.save()
									.then(() => {
										return res.status(201).json({
											message: 'Subcategory created successfully',
											status: 201
										});
									})
									.catch(error => {
										return res.status(500).json({
											message: 'Unable to create subcategory',
											error,
											status: 500
										});
									});
							})
							.catch(error => {
								return res.status(500).json({ error, status: 500 });
							});
					} catch (error) {
						return res.status(500).json({ error, message: 'Invalid details. Try again', status: 500 });
					}
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else {
		return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
	}
};

const getAllSubcategories = (req, res, next) => {
	// const authenticatedUser = req.decoded.user;

	// if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
	SubCategory.find()
		.select('name slug description category')
		.populate({ path: 'category', select: 'name' })
		.exec()
		.then(subcategories => {
			if (subcategories.length > 0) {
				res.status(200).json({
					message: 'Successfully fetched all sub categories',
					total: subcategories.length,
					subcategories,
					status: 200
				});
			} else {
				res.status(200).json({ message: 'No categories found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
	// } else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const getSingleSubcategory = (req, res, next) => {
	// const authenticatedUser = req.decoded.user;

	// if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {

	const id = req.params?.subcategoryId;

	SubCategory.findOne({ $or: [{ _id: id }, { slug: id }] })
		.select('name slug')
		.populate({ path: 'category', select: 'name slug' })
		.exec()
		.then(subcategory => {
			if (subcategory) {
				res.status(200).json({ subcategory, status: 200 });
			} else {
				res.status(200).json({ message: 'Subcategory not found', status: 200 });
			}
		})
		.catch(error => {
			console.log(error);
			res.status(500).json({ error });
		});
	// } else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const editSubcategory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.categoryId;
	const slug = req.params.slug;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		for (const property in req.body) {
			if (req.body[property] === null || req.body[property] === undefined) {
				delete req.body[property];
			}
		}

		const values = {
			name: req.body?.name,
			slug: slugify(req.body.name)
		};

		// Category.updateOne({ _id: id }, { $set: { ...values } })
		SubCategory.updateOne({ _id: id }, { $set: { ...values } })
			.exec()
			.then(() => {
				res.status(200).json({ message: 'Successfully updated subcategory details', status: 200 });
			})
			.catch(error => {
				res.status(500).json({ message: 'Unable to update category details', error, status: 500 });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const deleteSubcategory = (req, res, next) => {
	const id = req.params.subcategoryId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		SubCategory.findById(id)
			.exec()
			.then(async subcategory => {
				if (subcategory) {
					await SubCategory.deleteOne({ _id: id });
					return res.status(200).json({ message: 'Subcategory deleted successfully', status: 200 });
				} else {
					res.status(500).json({ message: 'Subcategory does not exist', status: 500 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

module.exports = {
	addSubcategory,
	getAllSubcategories,
	getSingleSubcategory,
	editSubcategory,
	deleteSubcategory
};
