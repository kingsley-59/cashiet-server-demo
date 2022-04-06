const mongoose = require('mongoose');
const fs = require('fs');
const Product = require('../models/product');
const slugify = require('slugify');
const { errorHandler } = require('../helpers/dbErrorHandler');
const { fileToBase64 } = require('../middleware/fileToBase64');
const getStream = require('get-stream');

const getAllProducts = (req, res, next) => {
	Product.find()
		.exec()
		.then(products => {
			if (products.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all products', total: products.length, products });
			} else {
				res.status(404).json({ message: 'No products found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const addProduct = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Product.find({ name: req.body.name, createdBy: authenticatedUser._id })
			.exec()
			.then(product => {
				if (product.length >= 1) {
					return res.status(409).json({ message: 'Product already created by you' });
				} else {
					try {
						var img = fs.readFileSync(req.file.path);
						var encode_img = img.toString('base64');

						var final_img = {
							contentType: req.file.mimetype,
							data: Buffer.from(encode_img, 'base64')
						};

						const newProduct = new Product({
							_id: new mongoose.Types.ObjectId(),
							name: req.body.name,
							price: req.body.price,
							keywords: req.body.keywords,
							image: {
								data: final_img.data,
								contentType: final_img.contentType
							},
							description: req.body.description,
							category: req.body.category,
							subCategoryOne: req.body.subCategoryOne,
							subCategoryTwo: req.body.subCategoryTwo,
							createdBy: authenticatedUser._id
						});

						return newProduct
							.save()
							.then(product => {
								return product
									.save()
									.then(() => {
										return res.status(201).json({
											message: 'Product created successfully'
										});
									})
									.catch(error => {
										return res.status(500).json({
											message: 'Unable to create product',
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
		return res.status(401).json({ error, message: 'Unauthorized access' });
	}
};

const editProduct = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.productId;

	if (authenticatedUser.role === 'admin') {
		Product.findOne({ _id: id })
			.exec()
			.then(result => {
				if (result) {
					for (const property in req.body) {
						if (req.body[property] === null || req.body[property] === undefined) {
							delete req.body[property];
						}
					}

					Product.updateOne({ _id: result._id }, { $set: { ...req.body } })
						.exec()
						.then(product => {
							res.status(200).json({ message: 'Successfully updated product details', product });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update product details', error });
						});
				} else return res.status(404).json({ message: 'Product with that id does not exist' });
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const deleteProduct = (req, res, next) => {
	const id = req.params.productId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Product.findById({ _id: id })
			.exec()
			.then(user => {
				if (user) {
					Product.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Product successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Product does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	getAllProducts,
	addProduct,
	editProduct,
	deleteProduct
};
