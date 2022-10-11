const mongoose = require('mongoose');
const Product = require('../models/product');
const wishlist = require('../models/wishlist');

const getAllWishList = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		wishlist
			.find()
			.populate({ path: 'products' })
			// .populate({ path: 'products', populate: { path: 'product', model: 'Product' } })
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({
						message: 'Successfully fetched all wish lists',
						total: result?.length,
						wishlists: result,
						status: 200
					});
				} else {
					res.status(200).json({ message: 'No wishlist found', status: 200, total: 0, wishlists: [] });
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
		// .populate({ path: 'products', populate: { path: 'product', model: 'Product' } })
		.populate({ path: 'products' })
		.then(result => {
			if (result.length > 0) {
				const wishList = result[0];
				res.status(200).json({
					message: 'Successfully fetched all wish lists',
					wishlist: {
						user: wishList?.user,
						products: wishList?.products || [],
						_id: wishList?._id,
						total: wishList?.products?.length || 0
					},
					status: 200
				});
			} else {
				res.status(200).json({ message: 'No wishlist found', status: 200, total: 0, wishlist: [] });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch wish lists', status: 500 });
		});
};

const addProductToWishList = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const productId = req.body.productId

	if (!productId) return res.status(400).json({ message: 'Please provide a product id', status: 400 });

	try {
		const product = await Product.findOne({_id: productId}).exec()
		if (!product) return res.status(400).json({ message: 'Product not found', status: 400 });

		const userWishlist = await wishlist.findOne({user: authenticatedUser._id}).exec()
		
		if (!userWishlist) {
			const newWishlist = new wishlist({
				_id: new mongoose.Types.ObjectId(),
				products: [productId],
				user: authenticatedUser._id
			})
			let result = await newWishlist.save()
			if (result) return res.status(201).json({message: 'Successfully added a product to wishList', data: result})
		} else {
			let duplicates = userWishlist.products.filter(product => product.toString() === productId)
			
			if (duplicates.length > 0) {
				return res.status(400).json({message: 'Product already exists in wishlist'})
			}
			userWishlist.products = [...userWishlist.products, productId]
			let result = await userWishlist.save()
			if (result) return res.status(201).json({message: 'Product added to wishlist', data: result })
		}
		throw new Error('Something broke!')
	} catch (error) {
		res.status(500).json({ error, message: error?.message ?? 'Something broke.' })
	}
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
				// check if product exists in wishlist,remove it if it does
				const allProducts = wishList[0]?.products;
				const productIndex = allProducts.findIndex(product => product.toString() === id);
				if (productIndex > -1) {
					allProducts.splice(productIndex, 1);
					wishList[0].save();
					res.status(200).json({ message: 'Successfully removed product from wishlist', status: 200 });
				} else {
					res.status(200).json({ message: 'Product not found in wishlist', status: 200 });
				}
			} else {
				res.status(200).json({ message: 'No wishlist found', status: 200 });
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

// const productIndex = wishList[0].products.findIndex(product => product.product.toString() === req.body.productId);
// if (productIndex > -1) return res.status(409).json({ message: 'Product already exists in wishlist', status: 409 });
