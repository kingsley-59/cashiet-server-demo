const Invoice = require('../models/invoice');

const getAllInvoices = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		try {
			Invoice.find()
				.exec()
				.then(invoices => {
					if (invoices.length > 0) {
						return res.status(200).json({ message: 'Successfully fetched all invoices', invoices, total: invoices.length });
					} else return res.status(200).json({ message: 'No order found' });
				})
				.catch(error => {
					return res.status(500).json({ error, message: 'Unable to create order' });
				});
		} catch (error) {
			res.status(500).json({ error });
		}
	} else return res.status(401).json({ message: 'Unauthorized access' });
};

const getAllUserInvoices = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Invoice.find({ user: authenticatedUser._id })
		.populate('order')
		.then(allInvoice => {
			if (allInvoice.length > 0) {
				return res.status(200).json({ message: 'Successfully fetched all invoices', invoices: allInvoice, total: allInvoice.length });
			} else {
				return res.status(404).json({ message: 'No invoice found' });
			}
		})
		.catch(error => res.status(500).json({ error }));
};

const getSpecificInvoice = (req, res, next) => {
	const orderId = req.params.orderId;

	Invoice.findOne({ order: orderId })
		.populate('order')
		.then(invoice => {
			if (invoice) {
				return res.status(200).json({ message: 'Invoice fetched successfully', invoice });
			} else {
				return res.status(200).json({ message: 'Invoice not found' });
			}
		})
		.catch(error => {
			return res.status(500).json({ error, message: 'Unable to create order' });
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
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Invoice successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Invoice does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	getAllInvoices,
	getAllUserInvoices,
	getSpecificInvoice,
	deleteInvoice
};
