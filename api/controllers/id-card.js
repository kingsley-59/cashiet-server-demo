const mongoose = require('mongoose');
const IDCard = require('../models/id-card');

const addCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	try {
		const card = new IDCard({
			_id: new mongoose.Types.ObjectId(),
			type: req.body.type.toLowerCase(),
			cardNumber: req.body.cardNumber,
			expiryDate: req.body.expiryDate,
			user: authenticatedUser._id
		});

		return card
			.save()
			.then(() =>
				res.status(201).json({
					message: 'Id card added successfully'
				})
			)
			.catch(error => {
				return res.status(500).json({ error });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Check your details and try again' });
	}
};

const getAllCards = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		IDCard.find()
			.populate('user')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all id cards', total: result.length, cards: result });
				} else {
					res.status(404).json({ message: 'No card found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const getSpecificCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	const id = req.params.cardId;

	IDCard.findOne({ _id: id })
		.populate('user')
		.exec()
		.then(card => {
			if (authenticatedUser.role === 'admin' || card.user._id === authenticatedUser._id) {
				res.status(200).json({ card });
			} else if (!(authenticatedUser.role === 'admin' || card.user._id === authenticatedUser._id)) {
				return res.status(401).json({ error, message: 'Unauthorized access' });
			} else {
				res.status(404).json({ message: 'No valid entry found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const updateCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.cardId;

	IDCard.findOne({ _id: id })
		.exec()
		.then(result => {
			if (result) {
				for (const property in req.body) {
					if (req.body[property] === null || req.body[property] === undefined) {
						delete req.body[property];
					}

					if (property === 'verificationStatus') {
						res.status(401).json({ message: 'Unauthorized to set the verification status' });
					}
				}

				if (authenticatedUser._id === result.user) {
					IDCard.updateOne({ _id: result._id }, { $set: { ...req.body } })
						.exec()
						.then(card => {
							res.status(200).json({ message: 'Successfully updated card details' });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update card details', error });
						});
				} else res.status(401).json({ message: 'Unauthorized access' });
			} else return res.status(404).json({ message: 'ID card with that id does not exist' });
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const verifyCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.cardId;

	if (authenticatedUser.role === 'admin') {
		IDCard.findOne({ _id: id })
			.exec()
			.then(result => {
				if (result.verificationStatus) {
					res.status(200).json({ message: 'Already verified' });
				} else {
					IDCard.updateOne({ _id: result._id }, { $set: { verificationStatus: true } })
						.exec()
						.then(card => {
							res.status(200).json({ message: 'Successfully updated card details' });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update card details', error });
						});
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: "Can't find card with that id" });
			});
	} else res.status(401).json({ message: 'Unauthorized access' });
};

const disableCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.cardId;

	if (authenticatedUser.role === 'admin') {
		IDCard.findOne({ _id: id })
			.exec()
			.then(result => {
				if (!result.verificationStatus) {
					res.status(200).json({ message: 'Not verified' });
				} else {
					IDCard.updateOne({ _id: result._id }, { $set: { verificationStatus: false } })
						.exec()
						.then(card => {
							res.status(200).json({ message: 'Successfully unverified card details' });
						})
						.catch(error => {
							res.status(500).json({ message: 'Unable to update card details', error });
						});
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: "Can't find card with that id" });
			});
	} else res.status(401).json({ message: 'Unauthorized access' });
};

const deleteCard = (req, res, next) => {
	const id = req.params.cardId;

	IDCard.findById({ _id: id })
		.exec()
		.then(card => {
			if (card) {
				card.remove((error, success) => {
					if (error) {
						return res.status(500).json({ error });
					}
					res.status(200).json({ message: 'ID card successfully deleted' });
				});
			} else {
				res.status(500).json({ message: 'ID card does not exist' });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'An error occured: ' + error.message });
		});
};

module.exports = {
	addCard,
	updateCard,
	verifyCard,
	disableCard,
	getAllCards,
	getSpecificCard,
	deleteCard
};
