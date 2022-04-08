const mongoose = require('mongoose');
const Profile = require('../models/Profile');

const addProfileDetails = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	try {
		const userProfile = new Profile({
			_id: new mongoose.Types.ObjectId(),
			firstName: req.body.firstName,
			middleName: req.body.middleName,
			lastName: req.body.lastName,
			gender: req.body.gender.toLowerCase(),
			profilePicture: `${process.env.BASE_URL}/uploads/` + req.file.filename,
			nationality: req.body.nationality.toLowerCase(),
			dob: req.body.dob,
			user: authenticatedUser._id
		});

		return userProfile
			.save()
			.then(() =>
				res.status(201).json({
					message: 'User profile created successfully'
				})
			)
			.catch(error => {
				return res.status(500).json({ error });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Check your details and try again' });
	}
};

const getAllUsersProfile = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Profile.find()
			.populate(user)
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all users profiles', total: result.length, profiles: result });
				} else {
					res.status(404).json({ message: 'No user profile found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const getCurrentUserProfile = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Profile.findById(authenticatedUser._id)
		.populate(user)
		.exec()
		.then(userProfile => {
			res.status(200).json({ userProfile, message: 'Successfully fetched user profile' });
		})
		.catch(error => {
			res.status(500).json({ error, message: 'No valid entry found' });
		});
};

const getUserProfileDetails = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		const id = req.params.id;

		Profile.findOne({ $or: [{ _id: id }, { user: id }] })
			.populate('user')
			.exec()
			.then(userProfile => {
				if (userProfile) {
					res.status(200).json({ userProfile });
				} else {
					res.status(404).json({ message: 'No valid entry found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const editUserProfile = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	for (const property in req.body) {
		if (req.body[property] === null || req.body[property] === undefined) {
			delete req.body[property];
		}
	}

	Profile.updateOne({ _id: authenticatedUser._id }, { $set: { ...req.body } })
		.exec()
		.then(user => {
			res.status(200).json({ message: 'Successfully updated user profile' });
		})
		.catch(error => {
			res.status(500).json({ message: 'Unable to update user profile', error });
		});
};

const updateProfileImage = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Profile.updateOne({ _id: authenticatedUser._id }, { $set: { profilePicture: `${process.env.BASE_URL}/uploads/` + req.file.filename } })
		.exec()
		.then(userProfile => {
			res.status(200).json({ message: 'Successfully updated profile picture' });
		})
		.catch(error => {
			res.status(500).json({ message: 'Unable to update profile picture', error });
		});
};

const deleteUserProfile = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		const id = req.params.profileId;

		Profile.findById({ _id: id })
			.exec()
			.then(user => {
				if (user) {
					user.remove((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'User successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'User does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	addProfileDetails,
	getAllUsersProfile,
	getCurrentUserProfile,
	getUserProfileDetails,
	editUserProfile,
	updateProfileImage,
	deleteUserProfile
};
