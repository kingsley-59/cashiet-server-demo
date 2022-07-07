const mongoose = require('mongoose');
const Category = require('../models/category');
const slugify = require('slugify');

const addCategory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Category.find({ name: req.body.name })
			.exec()
			.then(category => {
				if (category.length >= 1) {
					return res.status(409).json({ message: 'Category already exist' });
				} else {
					try {
						const newCategory = new Category({
							_id: new mongoose.Types.ObjectId(),
							name: req.body.name,
							slug: slugify(req.body.name),
							createdBy: authenticatedUser._id
						});

						return newCategory
							.save()
							.then(category => {
								return category
									.save()
									.then(() => {
										return res.status(201).json({
											message: 'Category created successfully',
											status: 201
										});
									})
									.catch(error => {
										return res.status(500).json({
											message: 'Unable to create category',
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
				res.status(500).json({ error, status: 500 });
			});
	} else {
		return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
	}
};

const getAllCategories = (req, res, next) => {
	Category.find()
		.select('name slug')
		.exec()
		.then(categories => {
			if (categories.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all categories', total: categories.length, categories, status: 200 });
			} else {
				res.status(404).json({ message: 'No categories found', status: 404 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch categories', status: 500 });
		});
};

const getCategory = (req, res, next) => {
	const id = req.params.categoryId;
	const slug = req.params.slug;

	Category.findOne({ $or: [{ _id: id }, { slug }] })
		.select('name slug')
		.exec()
		.then(category => {
			if (category) {
				res.status(200).json({ category, status: 200 });
			} else {
				res.status(404).json({ message: 'Category not found', status: 404 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch category', status: 500 });
		});
};

const editCategory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.categoryId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Category.findOne({ _id: id })
			.exec()
			.then(result => {
				if (result) {
					console.log(result);

					for (const property in req.body) {
						if (req.body[property] === null || req.body[property] === undefined) {
							delete req.body[property];
						}
					}

					const values = {
						name: req.body.name,
						slug: slugify(req.body.name)
					};

					Category.updateOne({ _id: result._id }, { $set: { ...values } })
						.exec()
						.then(() => {
							res.status(200).json({ message: 'Successfully updated category details', status: 200 });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update category details', error, status: 500 });
						});
				} else return res.status(404).json({ message: 'Category with that id does not exist', status: 404 });
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const deleteCategory = (req, res, next) => {
	const id = req.params.categoryId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Category.findById({ _id: id })
			.exec()
			.then(async (category) => {
				if (category) {
					await category.remove();
					res.status(200).json({ message: 'Category successfully deleted', status: 200 });
					// Category.deleteOne((error, success) => {
					// 	if (error) {
					// 		return res.status(500).json({ error, status:500 });
					// 	}
					// 	res.status(200).json({ message: 'Category successfully deleted', status: 200 });
					// });
				} else {
					res.status(404).json({ message: 'Category does not exist', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const deleteAllCategories = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Category.deleteMany((error, success) => {
			if (error) {
				return res.status(500).json({ error, status: 500 });
			}
			res.status(200).json({ message: 'All categories successfully deleted', status: 200 });
		});
	} else {
		return res.status(401).json({ message: 'Unauthorized access', status: 401 });
	}
};

module.exports = {
	addCategory,
	getAllCategories,
	getCategory,
	editCategory,
	deleteCategory,
	deleteAllCategories
};
