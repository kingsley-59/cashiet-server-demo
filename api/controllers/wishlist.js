const mongoose = require('mongoose');
const Product = require('../models/product');
const wishlist = require('../models/wishlist');

const getAllWishList = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		wishlist
			.find()
			.populate({ path: 'products', populate: { path: 'product', model: 'Product' } })
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({
						message: 'Successfully fetched all wish lists',
						total: result?.length,
						wishlists: result,
						status: 200
					});
				} else {
					res.status(404).json({ message: 'No wishlist found', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'Unable to fetch wish lists', status: 500 });
			});
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getUserWishList = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	wishlist
		.find({ user: authenticatedUser?._id })
		.populate({ path: 'products', populate: { path: 'product', model: 'Product' } })
		.then(result => {
			if (result.length > 0) {
				res.status(200).json({
					message: 'Successfully fetched all wish lists',
					total: result[0]?.products?.length,
					wishlist: result[0],
					status: 200
				});
			} else {
				res.status(404).json({ message: 'No wishlist found', status: 404 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch wish lists', status: 500 });
		});
};

const addProductToWishList = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (!req.body.productId) return res.status(400).json({ message: 'Please provide a product id', status: 400 });

	// find product with the given id. return error if not found
	Product.findById(req.body.productId)
		.then(product => {
			if (!product) return res.status(404).json({ message: 'Product not found', status: 404 });

			wishlist
				.find({ user: authenticatedUser?._id })
				.exec()
				.then(wishList => {
					const productIndex = wishList[0]?.products.findIndex(product => product.product.toString() === req.body.productId);
					if (productIndex > -1) return res.status(409).json({ message: 'Product already exists in wishlist', status: 409 });

					if (wishList?.length === 0) {
						const newProduct = new wishlist({
							_id: new mongoose.Types.ObjectId(),
							products: [{ product: req.body.productId }],
							user: authenticatedUser?._id
						});

						return newProduct
							.save()
							.then(() => {
								res.status(201).json({
									message: 'Successfully added a product to wishList',
									status: 201
								});
							})
							.catch(error => res.status(500).json({ error, message: 'Unable to save add product to wish list', status: 500 }));
					} else {
						const productIndex = wishList[0].products.findIndex(product => product.product.toString() === req.body.productId);
						if (productIndex > -1) return res.status(409).json({ message: 'Product already exists in wishlist', status: 409 });

						wishList[0].products?.push({ product: req.body.productId });
						wishList[0].save();
						res.status(201).json({ message: 'Successfully added a product to wishList', status: 201 });
					}
				});
		})
		.catch(error => res.status(500).json({ error, message: 'Unable to find product', status: 500 }));
};

const removeProductFromWishList = (req, res, next) => {
	const id = req.params.productId;
	const authenticatedUser = req.decoded.user;

	// remove product from wishlist
	wishlist
		.find({ user: authenticatedUser?._id })
		.exec()
		.then(wishList => {
			if (wishList?.length > 0) {
				// check if product exists in wishlist
				const productIndex = wishList[0].products.findIndex(product => product.product.toString() === id);
				if (productIndex > -1) {
					wishList[0].products.splice(productIndex, 1);
					wishList[0].save();
					res.status(200).json({ message: 'Successfully removed product from wishlist', status: 200 });
				} else {
					res.status(404).json({ message: 'Product not found in wishlist', status: 404 });
				}
			} else {
				res.status(404).json({ message: 'No wishlist found', status: 404 });
			}
		})
		.catch(error => res.status(500).json({ error, message: 'Unable to remove product from wish list', status: 500 }));
};

const deleteWishList = (req, res, next) => {
	const id = req.params.wishlistId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		wishlist
			.findByIdAndDelete(id)
			.then(result => {
				if (result) {
					res.status(200).json({ message: 'Successfully deleted wish list', status: 200 });
				}
			})
			.catch(error => res.status(500).json({ error, message: 'Unable to delete wish list', status: 500 }));
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

module.exports = {
	getAllWishList,
	getUserWishList,
	addProductToWishList,
	removeProductFromWishList,
	deleteWishList
};
