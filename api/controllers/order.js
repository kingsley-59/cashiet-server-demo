const mongoose = require('mongoose');
const Order = require('../models/order');
const Invoice = require('../models/invoice');

const createOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'user') {
		Order.findOne({ user: authenticatedUser._id, status: 'pending' })
			.then(previousOrder => {
				if (previousOrder) {
					return res.status(400).json({ message: 'You have an uncompleted order' });
				} else {
					try {
						let totalAmount = 0;

						if (req.body.orderItems) {
							req.body.orderItems.map(item => {
								const newPrice = item.quantity * item.unitPrice - (item.discount || 0) * item.quantity * item.unitPrice;
								totalAmount += newPrice;
							});
						} else res.status(400).json({ message: 'Order items not found' });

						const newOrder = new Order({
							_id: new mongoose.Types.ObjectId(),
							orderDate: new Date(),
							orderItems: req.body.orderItems,
							deliveryAddress: req.body.deliveryAddress,
							// deliveryAddress: {
							//     line1: req.body.deliveryAddress.line1,
							//     line2: req.body.deliveryAddress.line2,
							//     city: req.body.deliveryAddress.city,
							//     state: req.body.deliveryAddress.state,
							//     zip: req.body.deliveryAddress.zip,
							//     country: req.body.deliveryAddress.country,
							//     phoneNumber: req.body.deliveryAddress.phoneNumber,
							//     alternativePhoneNumber: req.body.deliveryAddress.alternativePhoneNumber,
							//     email: req.body.deliveryAddress.email,
							//     alternativeEmail: req.body.deliveryAddress.alternativeEmail,
							// },
							shippingFee: req.body.shippingFee,
							deliveryDate: req.body.deliveryDate,
							paymentOption: req.body.paymentOption,
							totalAmount: totalAmount,
							remainingAmount: totalAmount,
							user: authenticatedUser._id
						});

						return newOrder
							.save()
							.then(createdOrder => {
								const now = new Date();

								const newInvoice = new Invoice({
									_id: new mongoose.Types.ObjectId(),
									amount: totalAmount,
									dateIssued: new Date(),
									expiryDate: now.getDate() + 5,
									order: newOrder._id
								});

								return newInvoice
									.save()
									.then(invoice => {
										return res
											.status(201)
											.json({ message: 'Order and invoice created successfully', invoice: invoice, order: createdOrder });
									})
									.catch(error => {
										return res.status(500).json({ error, message: 'Unable to create invoice' });
									});
							})
							.catch(error => res.status(500).json({ error }));
					} catch (error) {
						return res.status(500).json({ error, message: 'Check your details and try again' });
					}
				}
			})
			.catch(error => {
				return res.status(500).json({ error, message: error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const getAllUserOrders = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Order.find({ user: authenticatedUser._id })
		.exec()
		.then(orders => {
			const removeCancelledOrders = orders.filter(item => item.status !== 'cancelled');
			if (removeCancelledOrders.length > 0) {
				return res.status(200).json({ message: 'Successfully fetched all orders', orders, total: orders.length });
			} else return res.status(200).json({ message: 'No order found' });
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to fetch order' });
		});
};

const getAllOrders = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		try {
			Order.find()
				.exec()
				.then(orders => {
					if (orders.length > 0) {
						return res.status(200).json({ message: 'Successfully fetched all orders', orders, total: orders.length });
					} else return res.status(200).json({ message: 'No order found' });
				})
				.catch(error => {
					return res.status(500).json({ error, message: 'Unable to fetch order' });
				});
		} catch (error) {
			res.status(500).json({ error });
		}
	} else return res.status(401).json({ message: 'Unauthorized access' });
};

const getSpecificOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	Order.findOne({ _id: orderId, user: authenticatedUser._id })
		.then(order => {
			if (order) {
				return res.status(200).json({ message: 'Order fetched successfully', order });
			} else {
				return res.status(200).json({ message: 'Order not found' });
			}
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to fetch order' });
		});
};

const getCurrentOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Order.findOne({ user: authenticatedUser._id, status: 'pending' })
		.then(order => {
			if (order) {
				return res.status(200).json({ message: 'Order fetched successfully', order });
			} else {
				return res.status(200).json({ message: 'No pending order found' });
			}
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to get order' });
		});
};

const cancelOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	try {
		Order.findOne({ user: authenticatedUser._id, paymentStatus: 'unpaid' }, (error, order) => {
			if (!order) return res.status(400).json({ message: 'We were unable to find an order with this id.' });
			if (order.status === 'cancelled') return res.status(400).json({ message: 'Order already cancelled' });

			// Cancel order
			order.status = 'cancelled';
			order.save(function (error) {
				if (error) {
					return res.status(500).json({ message: error.message, error });
				}
				res.status(200).json({ message: 'Order successfully cancelled' });
			});
		});
	} catch (error) {
		return res.status(500).json({ error });
	}
};

const deleteUserOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Order.findOne({ _id: orderId, paymentStatus: 'unpaid' })
			.exec()
			.then(order => {
				if (order) {
					order.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Order successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Order not found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ message: 'Unauthorized access' });
};

module.exports = {
	createOrder,
	getAllUserOrders,
	getAllOrders,
	getSpecificOrder,
	getCurrentOrder,
	cancelOrder,
	deleteUserOrder
};
