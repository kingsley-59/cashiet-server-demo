const mongoose = require('mongoose');
const address = require('../models/address');

const postAddress = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	try {
		const newAddress = new address({
			_id: new mongoose.Types.ObjectId(),
			addressLine1: req.body.addressLine1,
			addressLine2: req.body.addressLine2,
			city: req.body.city,
			state: req.body.state,
			zip: req.body.zip,
			country: req.body.country,
			phoneNumber: req.body.phoneNumber,
			alternativePhoneNumber: req.body.alternativePhoneNumber,
			email: req.body.email,
			alternativeEmail: req.body.alternativeEmail,
			user: authenticatedUser._id
		});

		return newAddress
			.save()
			.then(() =>
				res.status(201).json({
					message: 'Address saved successfully'
				})
			)
			.catch(error => {
				return res.status(500).json({ error });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Check your details and try again' });
	}
};

const getAllAddresses = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Address.find()
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all addresses', total: result.length, contacts: result });
				} else {
					res.status(404).json({ message: 'No address found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const updateAddress = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.addressId;

	Address.findOne({ _id: id })
		.exec()
		.then(result => {
			if (result) {
				for (const property in req.body) {
					if (req.body[property] === null || req.body[property] === undefined) {
						delete req.body[property];
					}
				}

				if (authenticatedUser._id === result.user) {
					Address.updateOne({ _id: result._id }, { $set: { ...req.body } })
						.exec()
						.then(product => {
							res.status(200).json({ message: 'Successfully updated address details', product });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update address details', error });
						});
				} else res.status(401).json({ message: 'Unauthorized access' });
			} else return res.status(404).json({ message: 'Address with that id does not exist' });
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const deleteAddress = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.addressId;

	Address.findById({ _id: id })
		.exec()
		.then(addr => {
			if (addr) {
				if (authenticatedUser.role === 'admin' || addr.user === authenticatedUser._id) {
					addr.remove((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Address successfully deleted' });
					});
				} else res.status(401).json({ message: 'Unauthorized access' });
			} else {
				res.status(500).json({ message: 'Address does not exist' });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'An error occured: ' + error.message });
		});
};

module.exports = {
	postAddress,
	updateAddress,
	getAllAddresses,
	deleteAddress
};
