const mongoose = require('mongoose');
const Partner = require('../models/partner');

const createPartner = (req, res, next) => {
	try {
		const newPartner = new Partner({
			_id: new mongoose.Types.ObjectId(),
			fullName: req.body.fullName.toLowerCase(),
			email: req.body.email.toLowerCase(),
			phoneNumber: req.body.phoneNumber,
			message: req.body.message
		});

		return newPartner
			.save()
			.then(partner => {
				return res.status(201).json({
					message: 'Partner created successfully',
					partner
				});
			})
			.catch(error => {
				return res.status(500).json({ error });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Incorrect details. Try again' });
	}
};

const getAllPartners = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Partner.find()
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all partners', total: result.length, partners: result });
				} else {
					res.status(404).json({ message: 'No partner found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ message: 'Unauthorized access' });
};

const getSinglePartner = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Partner.find({ _id: req.params.partnerId })
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched partner', partner: result });
				} else {
					res.status(404).json({ message: 'No partner with that id found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ message: 'Unauthorized access' });
};

const deletePartner = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const id = req.params.partnerId;

		Partner.findById({ _id: id })
			.exec()
			.then(partner => {
				if (partner) {
					partner.remove((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Partner successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Partner does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ message: 'Unauthorized access' });
};

module.exports = {
	createPartner,
	getSinglePartner,
	getAllPartners,
	deletePartner
};
