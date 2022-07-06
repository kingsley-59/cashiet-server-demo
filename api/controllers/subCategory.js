const mongoose = require('mongoose');
const SubCategory = require('../models/subcategory');
const slugify = require('slugify');

const addSubcategory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		SubCategory.find({ name: req.body.name })
			.exec()
			.then(category => {
				if (category.length >= 1) {
					return res.status(409).json({ message: 'Sub category already exist' });
				} else {
					try {
						const newCategory = new Category({
							_id: new mongoose.Types.ObjectId(),
							name: req.body.name,
							slug: slugify(req.body.name),
							description: req.body.description || '',
							category: req.body.categoryId,
							createdBy: authenticatedUser._id
						});

						return newCategory
							.save()
							.then(category => {
								return category
									.save()
									.then(() => {
										return res.status(201).json({
											message: 'Subcategory created successfully'
										});
									})
									.catch(error => {
										return res.status(500).json({
											message: 'Unable to create subcategory',
											error
										});
									});
							})
							.catch(error => {
								return res.status(500).json({ error });
							});
					} catch (error) {
						return res.status(500).json({ error, message: 'Invalid details. Try again' });
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
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		SubCategory.find()
			.exec()
			.then(subcategories => {
				if (subcategories.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all sub categories', total: subcategories.length, categories });
				} else {
					res.status(404).json({ message: 'No categories found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const getCategory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const id = req.params.categoryId;
		const slug = req.params.slug;

		SubCategory.findById({ $or: [{ id }, { slug }] })
			.exec()
			.then(category => {
				if (category) {
					res.status(200).json(category);
				} else {
					res.status(404).json({ message: 'Subcategory not found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
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
			name: req.body.name,
			slug: slugify(req.body.name)
		};

		// Category.updateOne({ _id: id }, { $set: { ...values } })
		SubCategory.updateOne({ $or: [{ id }, { slug }] }, { $set: { ...values } })
			.exec()
			.then(category => {
				res.status(200).json({ message: 'Successfully updated subcategory details' });
			})
			.catch(error => {
				res.status(500).json({ message: 'Unable to update category details', error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const deleteSubcategory = (req, res, next) => {
	const id = req.params.categoryId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Category.findById({ $or: [{ id }, { slug }] })
			.exec()
			.then(user => {
				if (user) {
					Category.remove((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Category successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Category does not exist' });
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
	getCategory,
	editSubcategory,
	deleteSubcategory
};
