const mongoose = require('mongoose');
const { uploadFile } = require('../middleware/s3');
const Product = require('../models/product');
const ProductGallery = require('../models/product-gallery');

const getAllProductGallery = (req, res, next) => {
	ProductGallery.find()
		.select('product images')
		.exec()
		.then(galleries => {
			if (galleries.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all product galleries', total: galleries.length, galleries, status: 200 });
			} else {
				res.status(404).json({ message: 'No product gallery found', status: 404 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, status: 500 });
		});
};

const addProductGallery = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const productId = req.body.productId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Product.findOne({ _id: productId })
			.exec()
			.then(async product => {
				if (product) {
					try {
						const uploadImages = await Promise.all(
							req.files.map(async file => {
								const result = await uploadFile(file);

								return {
									url: result?.Location,
									filetype: file.mimetype
								};
							})
						);

						const productCategory = new ProductGallery({
							_id: new mongoose.Types.ObjectId(),
							product: req.body.productId,
							images: uploadImages
							// images: req.files.map(async item => {
							// 	const getImageUrl = await getImageLink(item);
							// 	console.log({ getImageUrl });
							// 	return {
							// 		...item,
							// 		url: getImageUrl
							// 		// url: `${process.env.BASE_URL}/uploads/` + item.filename
							// 	};
							// })
						});

						product.gallery = productCategory._id;
						await product.save();

						return productCategory
							.save()
							.then(gallery =>
								res.status(201).json({
									message: 'Product gallery created successfully',
									gallery,
									status: 201
								})
							)
							.catch(error => {
								return res.status(500).json({ error, message: 'Unable to save images', status: 500 });
							});
					} catch (error) {
						return res.status(500).json({ error, message: 'Invalid details. Try again', status: 500 });
					}
				} else {
					res.status(404).json({ message: 'Product not found', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else {
		return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
	}
};

const getProductCategoryById = (req, res, next) => {
	const id = req.params.productId;

	ProductGallery.findOne({ _id: id })
		.exec()
		.then(gallery => {
			if (gallery) {
				res.status(200).json({ gallery, status: 200 });
			} else {
				res.status(404).json({ message: 'Product gallery not found', status: 404 });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const deleteProductGallery = (req, res, next) => {
	const id = req.params.productId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		ProductGallery.findById({ _id: id })
			.exec()
			.then(productGallery => {
				if (productGallery) {
					ProductGallery.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error, message: 'Unable to delete picture', status: 500 });
						}
						res.status(200).json({ message: 'Product gallery successfully deleted', status: 200 });
					});
				} else {
					res.status(404).json({ message: 'Product gallery does not exist', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message, status: 500 });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	getAllProductGallery,
	getProductCategoryById,
	addProductGallery,
	deleteProductGallery
};
