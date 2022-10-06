const mongoose = require('mongoose');
const Address = require('../models/address');

const postAddress = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	try {
		const newAddress = new Address({
			_id: new mongoose.Types.ObjectId(),
			line1: req.body?.line1,
			line2: req.body?.line2,
			city: req.body?.city,
			state: req.body?.state,
			zip: req.body?.zip,
			country: req.body?.country,
			phoneNumber: req.body?.phoneNumber,
			alternativePhoneNumber: req.body?.alternativePhoneNumber,
			email: req.body?.email,
			alternativeEmail: req.body?.alternativeEmail,
			user: authenticatedUser._id
		});

		return newAddress
			.save()
			.then(() =>
				res.status(201).json({
					status: 201,
					message: 'Address saved successfully'
				})
			)
			.catch(error => {
				return res.status(500).json({ error, message: 'Unable to save address', status: 500 });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Invalid details. Try again', status: 500 });
	}
};

const getAllAddresses = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Address.find()
			.select('line1 line2 city state zip country phoneNumber alternativePhoneNumber email alternativeEmail')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all addresses', total: result.length, addresses: result, status: 200 });
				} else {
					res.status(200).json({ message: 'No address found', status: 200, total: 0, addresses: [] });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'Unable to fetch user addresses', status: 500 });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const getSpecificUserAddresses = async (req, res) => {
	const authenticatedUser = req.decoded.user
	const userId = req.params.userId

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {

		try {
			const address = await Address.find({user: userId})
				.select('line1 line2 city state zip country phoneNumber alternativePhoneNumber email alternativeEmail')
				.exec()
			if (!address || address?.length == 0) return res.status(400).json({message: 'No address found'})

			res.status(200).json({message: 'Request successful', data: address})
		} catch (error) {
			res.status(500).json({ error, status: 500 });
		}
	} else {
		return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
	}
}

const getUserAddresses = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Address.find({ user: authenticatedUser._id })
		.select('line1 line2 city state zip country phoneNumber alternativePhoneNumber email alternativeEmail')
		.exec()
		.then(result => {
			if (result.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all addresses', total: result.length, addresses: result, status: 200 });
			} else {
				res.status(200).json({ message: 'No address found', status: 200, total: 0, addresses: [] });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to fetch user address', status: 500 });
		});
};

const updateAddress = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.addressId;

	Address.findOne({ _id: id, user: authenticatedUser?._id })
		.exec()
		.then(result => {
			console.log(result);
			if (result) {
				for (const property in req.body) {
					if (req.body[property] === null || req.body[property] === undefined) {
						delete req.body[property];
					}
				}

				Address.updateOne({ _id: result._id }, { $set: { ...req.body } })
					.exec()
					.then(() => {
						res.status(200).json({ message: 'Successfully updated address details', status: 200 });
					})
					.catch(error => {
						res.status(500).json({ message: 'Unable to update address details', error, status: 500 });
					});
			} else return res.status(200).json({ message: 'Address with that id does not exist', status: 200 });
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Address with that id not found', status: 500 });
		});
};

const deleteAddress = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.addressId;

	Address.findById({ _id: id })
		.exec()
		.then(async addr => {
			if (addr) {
				if (
					authenticatedUser.role === 'superadmin' ||
					authenticatedUser.role === 'admin' ||
					addr.user?.toString() === authenticatedUser._id?.toString()
				) {
					await addr.remove();
					return res.status(200).json({ message: 'Address successfully deleted', status: 200 });
					// addr.remove((error, success) => {
					// 	if (error) {
					// 		return res.status(500).json({ error, message: 'Unable to delete address', status: 500 });
					// 	}
					// 	res.status(200).json({ message: 'Address successfully deleted', status: 200 });
					// });
				} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
			} else {
				res.status(200).json({ message: 'Address does not exist', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Address with that id not found', status: 500 });
		});
};

module.exports = {
	postAddress,
	updateAddress,
	getAllAddresses,
	getSpecificUserAddresses,
	getUserAddresses,
	deleteAddress
};
