const mongoose = require('mongoose');
const Product = require('../models/product');
const slugify = require('slugify');
const OrderItems = require('../models/order-items');

const getAllOrderItems = (req, res, next) => {
	OrderItems.find()
		.exec()
		.then(orderItems => {
			if (orderItems.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all order items', total: orderItems.length, orderItems });
			} else {
				res.status(200).json({ message: 'No orderItems found', total: 0, orderItems: [] });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const addItemToNewOrder = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	const newOrder = new Order({
		_id: new mongoose.Types.ObjectId(),
		orderDate: new Date(),
		user: authenticatedUser._id
	});

	return newOrder
		.save()
		.then(newOrder => {
			try {
				const newOrderItem = new OrderItems({
					quantity: req.body.quantity,
					unitPrice: req.body.unitPrice,
					product: req.body.product,
					amount: req.body.quantity * req.body.unitPrice - (req.body.discount || 0) * req.body.quantity * req.body.unitPrice,
					order: newOrder._id
				});

				newOrderItem
					.save()
					.then(item =>
						res.status(201).json({
							message: 'Order created successfully'
						})
					)
					.catch(error => {
						return res.status(500).json({ error, message: 'Unable to add item to order' });
					});
			} catch (error) {
				return res.status(500).json({ error, message: 'Invalid details. Try again' });
			}
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to create order' });
		});
};

const addItemsToNewOrder = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	const newOrder = new Order({
		_id: new mongoose.Types.ObjectId(),
		orderDate: new Date(),
		user: authenticatedUser._id
	});

	return newOrder
		.save()
		.then(newOrder => {
			try {
				req.body.products.forEach(item => {
					const newOrderItem = new OrderItems({
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						product: item.product,
						amount: item.quantity * item.unitPrice - (item.discount || 0) * item.quantity * item.unitPrice,
						order: newOrder._id
					});

					newOrderItem
						.save()
						.then(item => console.log(item))
						.catch(error => {
							return res.status(500).json({ error, message: 'Unable to add item to order' });
						});
				});

				res.status(200).json({ message: 'Order saved successfully' });
			} catch (error) {
				return res.status(500).json({ error, message: 'Invalid details. Try again' });
			}
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to create order' });
		});
};

const addItemToPreviousOrder = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.orderId;

	Order.findOne({ user: authenticatedUser._id, _id: id })
		.exec()
		.then(order => {
			if (order) {
				try {
					const newOrderItem = new OrderItems({
						quantity: req.body.quantity,
						unitPrice: req.body.unitPrice,
						product: req.body.product,
						amount: req.body.quantity * req.body.unitPrice - (req.body.discount || 0) * req.body.quantity * req.body.unitPrice,
						order: id
					});

					newOrderItem
						.save()
						.then(item =>
							res.status(201).json({
								message: 'Order item created successfully'
							})
						)
						.catch(error => {
							return res.status(500).json({ error, message: 'Unable to add item to order' });
						});
				} catch (error) {
					return res.status(500).json({ error, message: 'Invalid details. Try again' });
				}
			} else {
				return res.status(200).json({ message: 'Order not found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const updateOrderItem = (req, res, next) => {
	const id = req.params.orderItemId;

	for (const property in req.body) {
		if (req.body[property] === null || req.body[property] === undefined || property === 'order') {
			delete req.body[property];
		}
	}

	OrderItems.updateOne({ _id: id }, { $set: { ...req.body } })
		.exec()
		.then(orderItem => {
			res.status(200).json({ message: 'Successfully updated order item details' });
		})
		.catch(error => {
			res.status(500).json({ message: 'Unable to update order item', error });
		});
};

const deleteOrderItem = (req, res, next) => {
	const id = req.params.orderItemId;

	OrderItems.findById({ _id: id })
		.exec()
		.then(orderItem => {
			if (orderItem) {
				Product.deleteOne((error, success) => {
					if (error) {
						return res.status(500).json({ error });
					}
					res.status(200).json({ message: 'Order item successfully deleted' });
				});
			} else {
				res.status(500).json({ message: 'Order item does not exist' });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'An error occured: ' + error.message });
		});
};

module.exports = {
	getAllOrderItems,
	addItemToNewOrder,
	addItemsToNewOrder,
	addItemToPreviousOrder,
	updateOrderItem,
	deleteOrderItem
};
