const mongoose = require('mongoose');
const Discount = require('../models/discount');
const ProductInventory = require('../models/product-inventory');

const addInventory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		try {
			const newProduct = new Discount({
				_id: new mongoose.Types.ObjectId(),
				quantity: req.body.quantity,
				product: req.body.product
			});

			return newProduct
				.save()
				.then(() =>
					res.status(201).json({
						message: 'Product inventory saved successfully'
					})
				)
				.catch(error => {
					return res.status(500).json({ error });
				});
		} catch (error) {
			return res.status(500).json({ error, message: 'Check your details and try again' });
		}
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const getInventories = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		ProductInventory.find()
			.populate('product')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all product inventories', total: result.length, inventories: result });
				} else {
					res.status(404).json({ message: 'No product inventory found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const getSpecificInventory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.inventoryId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		ProductInventory.findOne({ _id: id })
			.exec()
			.then(inventory => {
				if (inventory) {
					res.status(200).json({ inventory, message: 'Successfully fetched product inventory' });
				} else {
					res.status(404).json({ message: 'No valid entry found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const updateInventory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.inventoryId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		ProductInventory.findOne({ _id: id })
			.exec()
			.then(result => {
				if (result) {
					for (const property in req.body) {
						if (req.body[property] === null || req.body[property] === undefined) {
							delete req.body[property];
						}
					}

					ProductInventory.updateOne({ _id: result._id }, { $set: { ...req.body } })
						.exec()
						.then(() => {
							res.status(200).json({ message: 'Successfully updated product inventory' });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update product inventory', error });
						});
				} else return res.status(404).json({ message: 'Product inventory with that id does not exist' });
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const deleteInventory = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.inventoryId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		ProductInventory.findById({ _id: id })
			.exec()
			.then(inventory => {
				if (inventory) {
					inventory.remove((error, success) => {
						if (error) {
							return res.status(500).json({ error, message: 'Unable to delete inventory' });
						}

						res.status(200).json({ message: 'Inventory successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Inventory does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

module.exports = {
	addInventory,
	updateInventory,
	getSpecificInventory,
	getInventories,
	deleteInventory
};
