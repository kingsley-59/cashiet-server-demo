const mongoose = require('mongoose');
const Product = require('../models/product');
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
	const authenticatedUser = req.decoded.user;
	const productId = req.body.productId;

	if (authenticatedUser.role === 'admin') {
		Product.findOne({ _id: productId })
			.exec()
			.then(async product => {
				if (product) {
					try {
						const productCategory = new ProductGallery({
							_id: new mongoose.Types.ObjectId(),
							product: req.body.productId,
							images: req.files.map(item => ({
								...item,
								url: `${process.env.BASE_URL}/uploads/` + item.filename
							}))
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
			.then(productGallery => {
				if (productGallery) {
					ProductGallery.deleteOne((error, success) => {
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
