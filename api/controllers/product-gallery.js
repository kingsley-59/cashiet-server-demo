const mongoose = require('mongoose');
const Product = require('../models/product');
const slugify = require('slugify');
const ProductGallery = require('../models/product-gallery');

const getAllProductGallery = (req, res, next) => {
	ProductGallery.find()
		.exec()
		.then(galleries => {
			if (galleries.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all product galleries', total: galleries.length, galleries });
			} else {
				res.status(404).json({ message: 'No product gallery found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const addProductGallery = async (req, res, next) => {
	if (req.files) {
		console.log(req.files);
	}
	const authenticatedUser = req.decoded.user;
	const productId = req.params.productId;

	if (authenticatedUser.role === 'admin') {
		Product.findOne({ _id: productId })
			.exec()
			.then(product => {
				if (product) {
					try {
						let filesArray = [];
						req.files.forEach(image => {
							const file = {
								fileName: image.orinalname,
								filePath: image.path,
								fileType: image.mimetype
							};
							filesArray.push(file);
						});

						const productCategory = new ProductGallery({
							_id: new mongoose.Types.ObjectId(),
							product: req.body.product,
							images: filesArray
						});

						return productCategory
							.save()
							.then(gallery =>
								res.status(201).json({
									message: 'Product gallery created successfully',
									gallery
								})
							)
							.catch(error => {
								return res.status(500).json({ error });
							});
					} catch (error) {
						return res.status(500).json({ error, message: 'Invalid details. Try again' });
					}
				} else {
					res.status(404).json({ message: 'Product not found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else {
		return res.status(401).json({ error, message: 'Unauthorized access' });
	}
};

const getProductCategoryById = (req, res, next) => {
	const id = req.params.productId;

	ProductGallery.findOne({ _id: id })
		.exec()
		.then(gallery => {
			if (gallery) {
				res.status(200).json(gallery);
			} else {
				res.status(404).json({ message: 'Product gallery not found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const deleteProductGallery = (req, res, next) => {
	const id = req.params.productId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		ProductGallery.findById({ _id: id })
			.exec()
			.then(user => {
				if (user) {
					Product.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Product gallery successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Product gallery does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	getAllProductGallery,
	getProductCategoryById,
	addProductGallery,
	deleteProductGallery
};
