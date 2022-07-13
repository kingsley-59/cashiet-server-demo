const mongoose = require('mongoose');
const Product = require('../models/product');
const RecentlyViewed = require('../models/recently-viewed');

const getAllRecentlyViewed = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const result = await RecentlyViewed.find();

		if (result.length > 0) {
			res.status(200).json({
				message: 'Successfully fetched all recently viewed',
				total: result?.length,
				recentlyViewed: result,
				status: 200
			});
		} else {
			res.status(404).json({ message: 'No recently viewed found', status: 404 });
		}
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getUserRecentlyViewed = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	const result = await RecentlyViewed.find({ user: authenticatedUser?._id });

	if (result.length > 0) {
		res.status(200).json({
			message: 'Successfully fetched all recently viewed',
			total: result[0]?.products?.length,
			recentlyViewed: result[0],
			status: 200
		});
	} else {
		res.status(404).json({ message: 'No recently viewed found', status: 404 });
	}
};

const addProductToRecentlyViewed = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (!req.body?.productId) return res.status(400).json({ message: 'Please provide a product id', status: 400 });

	let product;

	try {
		product = await Product.findById(req.body?.productId);
	} catch (error) {
		return res.status(404).json({ message: 'Product not found', status: 404, error: error?.message });
	}

	if (!product) return res.status(404).json({ message: 'Product not found', status: 404 });

	RecentlyViewed.find({ user: authenticatedUser?._id })
		.exec()
		.then(recentlyViewed => {
			const productIndex = recentlyViewed[0]?.products.findIndex(product => product.product.toString() === req.body?.productId);
			if (productIndex > -1) return res.status(409).json({ message: 'Product already exists in recently viewed', status: 409 });

			if (recentlyViewed?.length === 0) {
				const newProduct = new RecentlyViewed({
					_id: new mongoose.Types.ObjectId(),
					products: [{ product: req.body?.productId }],
					user: authenticatedUser?._id
				});

				return newProduct
					.save()
					.then(() => {
						res.status(201).json({
							message: 'Successfully added a product to recently viewed',
							status: 201
						});
					})
					.catch(error => res.status(500).json({ error, message: 'Unable to save add product to recently viewed', status: 500 }));
			} else {
				const productIndex = recentlyViewed[0].products.findIndex(product => product.product.toString() === req.body?.productId);
				if (productIndex > -1) return res.status(409).json({ message: 'Product already exists in recently viewed', status: 409 });

				recentlyViewed[0].products?.push({ product: req.body?.productId });
				recentlyViewed[0].save();
				res.status(201).json({ message: 'Successfully added a product to recently viewed', status: 201 });
			}
		});
};

const removeProductFromRecentlyViewed = async (req, res, next) => {
	const id = req.params.productId;
	const authenticatedUser = req.decoded.user;

	RecentlyViewed
		.find({ user: authenticatedUser?._id })
		.exec()
		.then(recentlyViewed => {
			// console.log({recentlyViewed})
			if (recentlyViewed?.length > 0) {
				const productIndex = recentlyViewed[0]?.products.findIndex(product => product.product.toString() === id);
				if (productIndex > -1) {
					recentlyViewed[0].products.splice(productIndex, 1);
					recentlyViewed[0].save();
					res.status(200).json({ message: 'Successfully removed product from recently viewed', status: 200 });
				} else {
					res.status(404).json({ message: 'Product not found in recently viewed', status: 404 });
				}
			} else {
				res.status(404).json({ message: 'No recently viewed found', status: 404 });
			}
		})
		.catch(error => res.status(500).json({ error, message: 'Unable to remove product from recently viewed', status: 500 }));
};

const removeAllProductsFromRecentlyViewed = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const userId = authenticatedUser?.role === 'user' ? authenticatedUser?._id : req.body.userId;

	const recentlyViewed = await RecentlyViewed.findOne({ user: userId });

	if (!recentlyViewed) {
		return res.status(404).json({ message: 'No recently viewed found', status: 404 });
	}

	await RecentlyViewed.deleteMany({ user: userId });

	res.status(200).json({
		message: 'Successfully removed all user products from recently viewed',
		status: 200
	});
};

module.exports = {
	getAllRecentlyViewed,
	getUserRecentlyViewed,
	addProductToRecentlyViewed,
	removeProductFromRecentlyViewed,
	removeAllProductsFromRecentlyViewed
};
