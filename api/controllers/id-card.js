const mongoose = require('mongoose');
const IDCard = require('../models/id-card');
const axios = require('axios');
const Profile = require('../models/profile');
const IdCard = require('../models/id-card');

const token = process.env.APPRUVE_TEST_TOKEN;

const verifyCardDetails = async (res, userProfile, cardNumber, type, expiryDate) => {
	let verifyApi;
	if (type === 'driverLicense') {
		verifyApi = await axios.post(
			'https://api.appruve.co/v1/verifications/ng/driver_license',
			{
				id: cardNumber,
				first_name: userProfile.firstName,
				last_name: userProfile.lastName,
				middle_name: userProfile.middleName,
				date_of_birth: userProfile.dob,
				phone_number: userProfile.phoneNumber,
				gender: userProfile.gender === 'male' ? 'M' : 'F',
				address: userProfile.address,
				expiryDate: expiryDate
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);
	} else if (type === 'nin') {
		verifyApi = await axios.post(
			'https://api.appruve.co/v1/verifications/ng/national_id',
			{
				id: cardNumber,
				first_name: userProfile.firstName,
				last_name: userProfile.lastName,
				middle_name: userProfile.middleName,
				date_of_birth: userProfile.dob,
				phone_number: userProfile.phoneNumber,
				gender: userProfile.gender === 'male' ? 'M' : 'F'
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);
	} else if (type === 'bvn') {
		verifyApi = await axios.post(
			'https://api.appruve.co/v1/verifications/ng/bvn',
			{
				id: cardNumber,
				first_name: userProfile.firstName,
				last_name: userProfile.lastName,
				middle_name: userProfile.middleName,
				date_of_birth: userProfile.dob,
				phone_number: userProfile.phoneNumber
			},
			{
				headers: {
					Authorization: `Bearer ${token}`
				}
			}
		);
	} else return res.status(400).json({ message: 'Invalid ID' });

	return verifyApi?.data;
};

const addCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	IDCard.find({ type: req.body.type, cardNumber: req.body.cardNumber })
		.exec()
		.then(card => {
			if (card.length >= 1) {
				return res.status(409).json({ message: 'ID card already exist' });
			} else {
				try {
					const card = new IDCard({
						_id: new mongoose.Types.ObjectId(),
						type: req.body.type,
						cardNumber: req.body.cardNumber,
						expiryDate: req.body.expiryDate,
						issueDate: req.body.issueDate,
						user: authenticatedUser._id
					});

					return card
						.save()
						.then(newCard => {
							Profile.findOne({ user: authenticatedUser._id })
								.then(async userProfile => {
									if (userProfile) {
										try {
											const result = await verifyCardDetails(
												res,
												userProfile,
												req.body.cardNumber,
												req.body.type,
												req.body.expiryDate
											);

											if (result.status === 200) {
												IDCard.updateOne({ _id: newCard._id }, { $set: { verificationStatus: true, response: result } })
													.exec()
													.then(() => {
														return res.status(200).json({ message: 'Successfully verified card details' });
													})
													.catch(error => {
														return res.status(500).json({ message: 'Unable to verify card details', error });
													});
											} else return res.status(500).json({ message: 'Unable to verify card', response: result });
										} catch (error) {
											return res.status(500).json({ message: 'Card saved Unable to verify card details', error });
										}
									} else {
										res.status(200).json({ message: 'Cannot verify ID Card. Please, update your profile' });
									}
								})
								.catch(error => res.status(500).json({ error }));
						})
						.catch(error => {
							return res.status(500).json({ error });
						});
				} catch (error) {
					return res.status(500).json({ error, message: 'Check your details and try again' });
				}
			}
		})
		.catch(error => {
			return res.status(500).json({ error });
		});
};

const getAllCards = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		IDCard.find()
			.populate('user')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all id cards', total: result.length, cards: result });
				} else {
					res.status(200).json({ message: 'No card found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const getSpecificCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	const id = req.params.cardId;

	IDCard.findOne({ _id: id })
		// .select('type cardNumber expiryDate user')
		// .populate('user')
		.exec()
		.then(card => {
			if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin' || authenticatedUser._id === card.user) {
				res.status(200).json({ card });
			} else {
				return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const getUserCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	IDCard.find({ user: authenticatedUser._id })
		// .select('type cardNumber expiryDate')
		// .populate('user')
		.exec()
		.then(card =>
			card
				? res.status(200).json({ card, total: card.length })
				: res.status(200).json({ message: 'No card is found', card, total: card?.length })
		)
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
				if (result.verificationStatus) return res.status(400).json({ message: 'You cannot update a verified id' });

				for (const property in req.body) {
					if (req.body[property] === null || req.body[property] === undefined) {
						delete req.body[property];
					}

					if (property === 'verificationStatus') {
						res.status(401).json({ message: 'Unauthorized to set the verification status' });
					}
				}

				if (authenticatedUser._id?.toString() === result.user?.toString()) {
					IDCard.updateOne({ _id: id }, { $set: { ...req.body } })
						.exec()
						.then(async () => {
							const findProfile = await Profile.findOne({ user: authenticatedUser._id });
							const findCardDetails = await IDCard.findOne({ _id: id });

							try {
								const verificationResponse = verifyCardDetails(
									res,
									findProfile,
									findCardDetails?.cardNumber,
									findCardDetails?.type,
									findCardDetails?.expiryDate
								);

								console.log(verificationResponse);
								console.log('here');

								if (verificationResponse?.status === 200) {
									findCardDetails.verificationStatus = true;
									findCardDetails.response = verificationResponse;
									await findCardDetails.save();

									return res
										.status(200)
										.json({ message: 'Card details saved and verified successfully', response: verificationResponse });
								}

								return res.status(400).json({ message: 'Card details verification failed', response: verificationResponse });
							} catch (error) {
								return res.status(500).json({ message: 'Unable to verify card details' });
							}
						})
						.catch(error => {
							return res.status(500).json({ message: 'Unable to update card details', error });
						});
				} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
			} else return res.status(200).json({ message: 'ID card with that id does not exist' });
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const verifyCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.cardId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const disableCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.cardId;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const deleteCard = (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const id = req.params.cardId;

	IDCard.findOne({ _id: id })
		.exec()
		.then(card => {
			if (card) {
				if (
					authenticatedUser.role === 'superadmin' ||
					authenticatedUser.role === 'admin' ||
					authenticatedUser._id.toString() === card.user.toString()
				) {
					card.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'ID card successfully deleted' });
					});
				} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
			} else {
				res.status(500).json({ message: 'ID card does not exist' });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'An error occured: ' + error.message });
		});
};

const testCardVerification = async (req, res) => {
	const votersCard = {
		firstName: 'Henry',
		lastName: 'Nwandicne',
		middleName: 'Emeka',
		dob: '1976-04-15',
		phoneNumber: '08000110001',
		gender: 'M',
		address: 'Off Awolowo Way'
	};

	try {
		let response;
		// if (req.body.type === 'driverLicense')
		response = await verifyCardDetails(res, votersCard, 'ABC00578AA2', 'driverLicense', '2022-04-15');
		// console.log(response);
		return res.json({ response });
	} catch (error) {
		return res.status(500).json({ message: 'Error occur', error });
	}
};

module.exports = {
	addCard,
	updateCard,
	verifyCard,
	disableCard,
	getAllCards,
	getUserCard,
	getSpecificCard,
	deleteCard,
	testCardVerification
};
