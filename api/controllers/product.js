const mongoose = require('mongoose');
const Product = require('../models/product');
const slugify = require('slugify');
const ProductGallery = require('../models/product-gallery');
const { uploadFile } = require('../middleware/s3');

const getAllProducts = (req, res, next) => {
	Product.find()
		.exec()
		.then(products => {
			if (products.length > 0) {
				return res.status(200).json({ message: 'Successfully fetched all products', total: products.length, products: res.paginatedResults });
			} else {
				res.status(404).json({ message: 'No products found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const filterProducts = (req, res, next) => {
	Product.find()
		.exec()
		.then(products => {
			if (products.length > 0) {
				if (req.query.name) {
					const allProducts = products.filter(item => item.name.toLowerCase().includes(req.query.name?.toLowerCase()));
					return res.status(200).json({ message: 'Successfully fetched all products', total: allProducts.length, products: allProducts });
				}
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

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Product.find({ name: req.body.name, createdBy: authenticatedUser._id })
			.exec()
			.then(async product => {
				if (product.length >= 1) {
					return res.status(409).json({ message: 'Product already created by you' });
				} else {
					const uploadImage = async () => {
						const response = await uploadFile(req.file);

						return response;
					};

					const imageResult = await uploadImage();

					try {
						const newProduct = new Product({
							_id: new mongoose.Types.ObjectId(),
							name: req.body?.name,
							slug: slugify(req.body?.name),
							price: +req.body?.price,
							keywords: req.body?.keywords,
							image: {
								// url: `${process.env.BASE_URL}/uploads/` + req.file.filename,
								url: imageResult.Location,
								contentType: req.file.mimetype
							},
							dimension: {
								length: +req.body?.productLength,
								width: +req.body?.productWidth,
								height: +req.body?.productHeight
							},
							description: req.body?.description,
							category: req.body?.category,
							subCategoryOne: req.body?.subCategoryOne,
							subCategoryTwo: req.body?.subCategoryTwo,
							createdBy: authenticatedUser._id
						});

						return newProduct
							.save()
							.then(product => {
								return res.status(201).json({
									message: 'Product created successfully'
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

const getProduct = (req, res, next) => {
	const id = req.params.productId;

	Product.findOne({ _id: id })
		.populate('category')
		.exec()
		.then(product => {
			if (product) {
				ProductGallery.findOne({ product: product._id })
					.then(gallery => {
						gallery ? res.status(200).json({ product, gallery }) : res.status(200).json(product);
					})
					.catch(error => res.status(500).json({ error, message: 'Unable to get the product category' }));
			} else {
				res.status(404).json({ message: 'Product not found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const getProductsByCategory = (req, res, next) => {
	Product.find({ category: req.params.categoryId })
		.populate('category')
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

const editProduct = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.productId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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

const searchProduct = (req, res, next) => {
	Product.find()
		.exec()
		.then(products => {
			if (products.length > 0) {
				if (req.params.search) {
					const allProducts = products.filter(item => item.name.toLowerCase().includes(req.params.search));
					return res.status(200).json({ message: 'Successfully fetched all products', total: allProducts.length, products: allProducts });
				}
				res.status(200).json({ message: 'Successfully fetched all products', total: products.length, products });
			} else {
				res.status(404).json({ message: 'No products found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

module.exports = {
	getAllProducts,
	filterProducts,
	getProduct,
	getProductsByCategory,
	addProduct,
	editProduct,
	deleteProduct,
	searchProduct
};
