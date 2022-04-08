const mongoose = require('mongoose');
const Discount = require('../models/discount');

const addNewDiscount = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		try {
			const newDiscount = new Discount({
				_id: new mongoose.Types.ObjectId(),
				name: req.body.name,
				description: req.body.description,
				discountPercent: req.body.discountPercent,
				active: req.body.active
			});

			return newDiscount
				.save()
				.then(() =>
					res.status(201).json({
						message: 'Discount saved successfully'
					})
				)
				.catch(error => {
					return res.status(500).json({ error });
				});
		} catch (error) {
			return res.status(500).json({ error, message: 'Check your details and try again' });
		}
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const getAllDiscounts = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Discount.find()
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all discounts', total: result.length, discounts: result });
				} else {
					res.status(404).json({ message: 'No discount found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const getSpecificDiscount = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.discountId;

	if (authenticatedUser.role === 'admin') {
		Discount.findOne({ _id: id })
			.exec()
			.then(discount => {
				if (discount) {
					res.status(200).json({ discount, message: 'Successfully fetched discount' });
				} else {
					res.status(404).json({ message: 'No valid entry found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const updateDiscount = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.discountId;

	if (authenticatedUser.role === 'admin') {
		Discount.findOne({ _id: id })
			.exec()
			.then(result => {
				if (result) {
					for (const property in req.body) {
						if (req.body[property] === null || req.body[property] === undefined) {
							delete req.body[property];
						}
					}

					Discount.updateOne({ _id: result._id }, { $set: { ...req.body } })
						.exec()
						.then(() => {
							res.status(200).json({ message: 'Successfully updated discount details' });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update discount details', error });
						});
				} else return res.status(404).json({ message: 'Discount with that id does not exist' });
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else res.status(401).json({ message: 'Unauthorized access' });
};

const deleteDiscount = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.discountId;

	if (authenticatedUser.role === 'admin') {
		Discount.findById({ _id: id })
			.exec()
			.then(discount => {
				if (discount) {
					discount.remove((error, success) => {
						if (error) {
							return res.status(500).json({ error, message: 'Unable to delete discount' });
						}

						res.status(200).json({ message: 'Discount successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Discount does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else res.status(401).json({ message: 'Unauthorized access' });
};

module.exports = {
	addNewDiscount,
	updateDiscount,
	getSpecificDiscount,
	getAllDiscounts,
	deleteDiscount
};
