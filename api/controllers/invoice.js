const Invoice = require('../models/invoice');

const getAllInvoices = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		try {
			Invoice.find()
				.exec()
				.then(invoices => {
					if (invoices.length > 0) {
						return res.status(200).json({ message: 'Successfully fetched all invoices', invoices, total: invoices.length, status: 200 });
					} else return res.status(200).json({ message: 'No order found', status: 200 });
				})
				.catch(error => {
					return res.status(500).json({ error, message: 'Unable to find invoices', status: 500 });
				});
		} catch (error) {
			res.status(500).json({ error, status: 500 });
		}
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getAllUserInvoices = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Invoice.find({ user: authenticatedUser._id })
		.populate('order')
		.then(allInvoice => {
			if (allInvoice.length > 0) {
				return res
					.status(200)
					.json({ message: 'Successfully fetched all invoices', invoices: allInvoice, total: allInvoice.length, status: 200 });
			} else {
				return res.status(200).json({ message: 'No invoice found', status: 200 });
			}
		})
		.catch(error => res.status(500).json({ error, status: 500 }));
};

const getSpecificInvoice = (req, res, next) => {
	const invoiceId = req.params.invoiceId;

	Invoice.findOne({ _id: invoiceId })
		.populate('order')
		.then(invoice => {
			if (invoice) {
				return res.status(200).json({ message: 'Invoice fetched successfully', invoice, status: 200 });
			} else {
				return res.status(200).json({ message: 'Invoice not found', status: 200 });
			}
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to create order', status: 500 });
		});
};

const deleteInvoice = (req, res, next) => {
	const id = req.params.invoiceId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Invoice.findById({ _id: id })
			.exec()
			.then(invoice => {
				if (invoice) {
					invoice.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error, status: 400 });
						}
						res.status(200).json({ message: 'Invoice successfully deleted', status: 200 });
					});
				} else {
					res.status(200).json({ message: 'Invoice does not exist', status: 200 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const getOrderInvoices = (req, res) => {
	const authenticatedUser = req.decoded.user;
	const orderId = req.params.orderId;

	Invoice.find({ user: authenticatedUser._id, order: orderId })
		.populate('order')
		.exec()
		.then(invoices => {
			if (invoices.length > 0) {
				res.status(200).json({
					message: 'Invoices attached to the order fetched successfully',
					allInvoices: invoices,
					total: invoices?.length
				});
			} else res.status(200).json({ message: 'No invoice attached to the order found' });
		})
		.catch(error => res.status(500).json(error));
};

module.exports = {
	getAllInvoices,
	getAllUserInvoices,
	getSpecificInvoice,
	deleteInvoice,
	getOrderInvoices
};
