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
					status: 201,
					message: 'Partner created successfully',
					partner
				});
			})
			.catch(error => {
				return res.status(500).json({ error, message: 'Unable to create partner', status: 500 });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Incorrect details. Try again' });
	}
};

const getAllPartners = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Partner.find()
			.select('_id fullName email phoneNumber message')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all partners', total: result.length, partners: result, status: 200 });
				} else {
					res.status(200).json({ message: 'No partner found', status: 200, total: 0, partners: [] });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getSinglePartner = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Partner.find({ _id: req.params.partnerId })
			.select('_id fullName email phoneNumber message')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched partner', partner: result, status: 200 });
				} else {
					res.status(200).json({ message: 'No partner with that id found', status: 200, partner: null });
				}
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
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
							return res.status(500).json({ error, message: 'Unable to delete partner details', status: 500 });
						}
						res.status(200).json({ message: 'Partner successfully deleted', status: 200 });
					});
				} else {
					res.status(200).json({ message: 'Partner does not exist', status: 200 });
				}
			})
			.catch(error => {
				res.status(200).json({ error, message: 'Partner does not exist', status: 200 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

module.exports = {
	createPartner,
	getSinglePartner,
	getAllPartners,
	deletePartner
};
