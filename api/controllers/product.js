const mongoose = require('mongoose');
const Product = require('../models/product');
const slugify = require('slugify');
const ProductGallery = require('../models/product-gallery');
const { uploadFile } = require('../middleware/s3');
const path = require('path');
const sharp = require('sharp');
const category = require('../models/category');
const fs = require('fs');

const getNewArrivals = async () => {
	const total = await Product.find()
		.select('name slug sku price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings')
		.populate('category gallery')
		.sort({ createdAt: -1 })
		.limit(req.query?.limit || 10);

	return total;
};

const getAllProducts = (req, res, next) => {
	Product.find()
		.select('name slug sku price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings')
		.populate({ path: 'category', select: 'name' })
		.populate({ path: 'gallery', select: 'images' })
		.exec()
		.then(products => {
			if (products.length > 0) {
				return res
					.status(200)
					.json({ message: 'Successfully fetched all products', total: products.length, products: res.paginatedResults, status: 200 });
			} else {
				res.status(200).json({ message: 'No products found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch products', status: 500 });
		});
};

const getTopSellingProducts = (req, res, next) => {
	Product.find({ quantitySold: { $gte: 0 } })
		.select('name slug sku price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings')
		.populate('category gallery')
		.sort({ quantitySold: -1 })
		.limit(req.query?.limit || 10)
		.exec()
		.then(async products => {
			if (products.length > 0) {
				return res
					.status(200)
					.json({ message: 'Successfully fetched all top selling products', total: products.length, products, status: 200 });
			} else {
				Product.find()
					.select('name slug sku price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings')
					.populate({ path: 'category', select: 'name' })
					.populate({ path: 'gallery', select: 'images' })
					.exec()
					.then(newProducts => {
						if (newProducts.length > 0) {
							return res.status(200).json({
								message: 'Successfully fetched all products',
								total: newProducts.length,
								products: newProducts,
								status: 200
							});
						} else {
							res.status(200).json({ message: 'No products found', status: 200 });
						}
					})
					.catch(error => {
						res.status(500).json({ error, message: 'Unable to fetch products', status: 500 });
					});
				// res.status(200).json({ message: 'No products found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch products', status: 500 });
		});
};

const getNewProducts = (req, res, next) => {
	Product.find()
		.select('name slug sku price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings')
		.populate('category gallery')
		.sort({ createdAt: -1 })
		.limit(req.query?.limit || 10)
		.exec()
		.then(products => {
			if (products.length > 0) {
				return res.status(200).json({ message: 'Successfully fetched latest products', total: products.length, products, status: 200 });
			} else {
				res.status(200).json({ message: 'No products found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch products', status: 500 });
		});
};

const filterProducts = (req, res, next) => {
	Product.find()
		.select('name slug sku price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings')
		.populate({ path: 'category', select: 'name' })
		.exec()
		.then(products => {
			if (products.length > 0) {
				const filters = req.query;

				const filteredProducts = products.filter(product => {
					let isValid = true;
					for (key in filters) {
						isValid = isValid && (product[key] == filters[key] || product[key]?.indexOf(filters[key]) > -1);
					}
					return isValid;
				});

				res.status(200).json({
					message: 'Successfully fetched products',
					total: filteredProducts.length,
					products: filteredProducts,
					status: 200
				});
			} else {
				res.status(200).json({ message: 'No products found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch products', status: 500 });
		});
};

const addProduct = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const { SMALL_IMAGE_WIDTH, SMALL_IMAGE_HEIGHT } = process.env;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const findCategory = await category.findOne({ _id: req.body.category });
		if (!findCategory) {
			return res.status(200).json({ message: 'Category not found', status: 200 });
		}

		Product.find({ name: req.body.name, createdBy: authenticatedUser._id })
			.exec()
			.then(async product => {
				if (product.length >= 1) {
					return res.status(409).json({ message: 'Product already exist', status: 409 });
				} else {
					const { filename: image } = req.file;

					await sharp(req.file.path)
						.resize(+SMALL_IMAGE_WIDTH, +SMALL_IMAGE_HEIGHT)
						.toFile(path.resolve(req.file.destination, 'resized', image));

					const obj = {
						path: path.resolve(req.file.destination, 'resized', image),
						filename: image
					};

					let imageResult;

					try {
						imageResult = await uploadFile(obj);
					} catch (error) {
						return res.status(500).json({ error, message: 'Unable to upload product image', status: 500 });
					}

					fs.unlinkSync(obj.path);
					fs.unlinkSync(req.file.path);

					// const imageResult = await uploadFile(obj);

					const generateProductSku = () => {
						const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
						const numbers = '0123456789';
						const id = [
							alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
							alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
							alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
							numbers.charAt(Math.floor(Math.random() * numbers.length)),
							numbers.charAt(Math.floor(Math.random() * numbers.length)),
							numbers.charAt(Math.floor(Math.random() * numbers.length)),
							numbers.charAt(Math.floor(Math.random() * numbers.length)),
							alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
							alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
							alphabet.charAt(Math.floor(Math.random() * alphabet.length))
						].join('');
						return id;
					};

					try {
						const newProduct = new Product({
							_id: new mongoose.Types.ObjectId(),
							name: req.body?.name,
							slug: slugify(req.body?.name),
							sku: generateProductSku()?.toUpperCase(),
							price: +req.body?.price,
							keywords: req.body?.keywords,
							image: {
								url: imageResult.Location,
								contentType: req.file.mimetype
							},
							dimension: {
								length: +req.body?.productLength || null,
								width: +req.body?.productWidth || null,
								height: +req.body?.productHeight || null
							},
							description: req.body?.description,
							category: req.body?.category,
							quantity: req.body?.quantity,
							subCategoryOne: req.body?.subCategoryOne,
							subCategoryTwo: req.body?.subCategoryTwo,
							createdBy: authenticatedUser._id
						});

						return newProduct
							.save()
							.then(product => {
								return res.status(201).json({
									message: 'Product created successfully',
									status: 201,
									productId: product?._id
								});
							})
							.catch(error => {
								return res.status(500).json({ error, message: 'Unable to save product details', status: 500 });
							});
					} catch (error) {
						return res.status(500).json({ error, message: 'Invalid details. Try again', status: 500 });
					}
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'Invalid details', status: 500 });
			});
	} else {
		return res.status(401).json({ message: 'Unauthorized access', status: 401 });
	}
};

const getProduct = (req, res, next) => {
	const id = req.params.productId;

	Product.findOne({ _id: id })
		.select('name slug sku price keywords description weight dimension gallery category subCategoryOne subCategoryTwo image ratings')
		.populate({ path: 'category', select: 'name' })
		.exec()
		.then(product => {
			if (product) {
				ProductGallery.findOne({ product: product._id })
					.then(gallery => {
						gallery ? res.status(200).json({ product, gallery, status: 200 }) : res.status(200).json({ product, status: 200 });
					})
					.catch(error => res.status(500).json({ error, message: 'Unable to get the product category', status: 500 }));
			} else {
				res.status(200).json({ message: 'Product not found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to retrieve product', status: 500 });
		});
};

const getProductsByCategory = (req, res, next) => {
	Product.find({ category: req.params.categoryId })
		.select('name slug sku price keywords description weight dimension category subCategoryOne subCategoryTwo image ratings')
		.populate({ path: 'category', select: 'name' })
		.exec()
		.then(products => {
			if (products.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all products', total: products.length, products, status: 200 });
			} else {
				res.status(200).json({ message: 'No products found', status: 200, total: 0 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to retrieve products', status: 500 });
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
						.then(() => {
							res.status(200).json({ message: 'Successfully updated product details', status: 200 });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update product details', error, status: 500 });
						});
				} else return res.status(200).json({ message: 'Product with that id does not exist', status: 200 });
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const deleteProduct = (req, res, next) => {
	const id = req.params.productId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Product.findById({ _id: id })
			.exec()
			.then(async product => {
				if (product) {
					await ProductGallery.deleteMany({ product: product._id });
					await product.remove();

					return res.status(200).json({ message: 'Successfully deleted product', status: 200 });
					// Product.deleteOne({ _id: id })
					// 	.exec()
					// 	.then(() => {
					// 		ProductGallery.deleteOne({ product: product._id })
					// 			.exec()
					// 			.then(() => {
					// 				res.status(200).json({ message: 'Successfully deleted product', status: 200 });
					// 			})
					// 			.catch(error => {
					// 				res.status(500).json({ error, message: 'Unable to delete product', status: 500 });
					// 			});
					// 	})
					// 	.catch(error => {
					// 		res.status(500).json({ error, message: 'Unable to delete product', status: 500 });
					// 	});
				} else {
					res.status(200).json({ message: 'Product does not exist', status: 200 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'error occur', status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const searchProduct = (req, res, next) => {
	Product.find()
		.exec()
		.then(products => {
			if (products.length > 0) {
				if (req.params.search) {
					const allProducts = products.filter(item => item.name.toLowerCase().includes(req.params.search));
					return res
						.status(200)
						.json({ message: 'Successfully fetched all products', total: allProducts.length, products: allProducts, status: 200 });
				}
				res.status(200).json({ message: 'Successfully fetched all products', total: products.length, products, status: 200 });
			} else {
				res.status(200).json({ message: 'No products found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to process the search', status: 500 });
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
	searchProduct,
	getTopSellingProducts,
	getNewProducts
};
