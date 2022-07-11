const mongoose = require('mongoose');
const Order = require('../models/order');
const Invoice = require('../models/invoice');
const paymentOptions = require('../models/payment-options');
const cron = require('node-cron');

const createOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'user') {
		Order.findOne({ user: authenticatedUser._id, status: 'pending' })
			.then(previousOrder => {
				if (previousOrder) {
					return res.status(400).json({ message: 'You have an uncompleted order', status: 400 });
				}

				if (!req.body.orderItems) {
					return res.status(404).json({ message: 'Order items not found', status: 404 });
				}

				try {
					let totalAmount = 0;

					req.body.orderItems.map(item => {
						const newPrice =
							item.quantity * item.unitPrice - (item.discount || 0) * item.quantity * item.unitPrice + (item.shippingFee || 0);
						totalAmount += newPrice;
					});

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
						duration: req.body.duration || 0,
						user: authenticatedUser._id
					});

					return newOrder
						.save()
						.then(async createdOrder => {
							const now = new Date();

							paymentOptions
								.findOne({ _id: req.body.paymentOption })
								.then(response => {
									if (response?.type === 'save_and_buy_later') {
										return res.status(201).json({
											message: 'Order created successfully. Proceed to setup payment',
											order: createdOrder,
											status: 201
										});
									} else {
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
												return res.status(201).json({
													message: 'Order and invoice created successfully',
													invoice: invoice,
													order: createdOrder,
													status: 201
												});
											})
											.catch(error => {
												return res.status(500).json({ error, message: 'Unable to create invoice', status: 500 });
											});
									}
								})
								.catch(error => res.status(500).json({ error, status: 500 }));

							// const findPaymentOption = await paymentOptions.findOne({ _id: req.body.paymentOption });
							// console.log(findPaymentOption);
						})
						.catch(error => res.status(500).json({ error, status: 500 }));
				} catch (error) {
					return res.status(500).json({ error, message: 'Check your details and try again', status: 500 });
				}
			})
			.catch(error => {
				return res.status(500).json({ error, message: error.message });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getAllUserOrders = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Order.find({ user: authenticatedUser._id })
		.populate('user recurringPayment')
		.populate({ path: 'orderItems', populate: { path: 'product', model: 'Product', select: 'name' } })
		.exec()
		.then(orders => {
			if (orders.length > 0) {
				return res.status(200).json({ message: 'Successfully fetched all orders', orders, total: orders.length, status: 20 });
			} else return res.status(404).json({ message: 'No order found', status: 404 });
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to fetch order', status: 500 });
		});
};

const getAllOrders = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		try {
			Order.find()
				.populate('user recurringPayment')
				.populate({ path: 'orderItems', populate: { path: 'product', model: 'Product', select: 'name' } })
				.exec()
				.then(orders => {
					if (orders.length > 0) {
						return res.status(200).json({ message: 'Successfully fetched all orders', orders, total: orders.length, status: 200 });
					} else return res.status(404).json({ message: 'No order found', status: 404 });
				})
				.catch(error => {
					return res.status(500).json({ error, message: 'Unable to fetch order', status: 500 });
				});
		} catch (error) {
			res.status(500).json({ error, status: 500 });
		}
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getSpecificOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	Order.findOne({ _id: orderId, user: authenticatedUser._id })
		.populate('user recurringPayment')
		.populate({ path: 'orderItems', populate: { path: 'product', model: 'Product', select: 'name' } })
		.then(order => {
			if (order) {
				return res.status(200).json({ message: 'Order fetched successfully', order });
			} else {
				return res.status(404).json({ message: 'Order not found', status: 404 });
			}
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to fetch order', status: 500 });
		});
};

const adminGetSpecificOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	if (authenticatedUser?.role === 'admin' || authenticatedUser?.role === 'superadmin') {
		Order.findOne({ _id: orderId })
			.populate('user recurringPayment')
			.populate({ path: 'orderItems', populate: { path: 'product', model: 'Product', select: 'name' } })
			.then(order => {
				if (order) {
					return res.status(200).json({ message: 'Order fetched successfully', order, status: 200 });
				} else {
					return res.status(404).json({ message: 'Order not found', status: 404 });
				}
			})
			.catch(error => {
				return res.status(500).json({ error, message: 'Unable to fetch order', status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getCurrentOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Order.findOne({
		$or: [
			{ user: authenticatedUser._id, status: 'pending' },
			{ user: authenticatedUser._id, status: 'paid', paymentStatus: 'unpaid' },
			{ user: authenticatedUser._id, status: 'paid', paymentStatus: 'part_payment' }
		]
	})
		.populate('user recurringPayment')
		.populate({ path: 'orderItems', populate: { path: 'product', model: 'Product', select: 'name' } })
		.then(order => {
			return res.status(200).json({ message: 'Order fetched successfully', order, status: 200 });
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to get order', status: 500 });
		});
};

const cancelOrder = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	try {
		Order.findOne({ user: authenticatedUser._id, paymentStatus: 'unpaid', _id: orderId }, (error, order) => {
			if (!order) return res.status(400).json({ message: 'We were unable to find an order with this id.', status: 400 });
			if (order.status === 'cancelled') return res.status(400).json({ message: 'Order already cancelled', status: 400 });

			// Cancel order
			order.status = 'cancelled';
			order.save(function (error) {
				if (error) {
					return res.status(500).json({ message: error.message, error, status: 500 });
				}
				res.status(200).json({ message: 'Order successfully cancelled', status: 200 });
			});
		});
	} catch (error) {
		return res.status(500).json({ error, status: 500 });
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
							return res.status(500).json({ error, status: 500 });
						}
						res.status(200).json({ message: 'Order successfully deleted', status: 200 });
					});
				} else {
					res.status(500).json({ message: 'Order not found', status: 500 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message, status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

module.exports = {
	createOrder,
	getAllUserOrders,
	getAllOrders,
	getSpecificOrder,
	adminGetSpecificOrder,
	getCurrentOrder,
	cancelOrder,
	deleteUserOrder
};
