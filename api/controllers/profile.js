const mongoose = require('mongoose');
const Profile = require('../models/profile');
const { uploadFile } = require('../middleware/s3');
// const sharp = require('sharp');

const addProfileDetails = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;
	const findUserProfile = await Profile.findOne({ user: authenticatedUser._id });
	if (findUserProfile) return res.status(400).json({ message: 'User profile already added', status: 400 });

	const uploadImage = async () => {
		const response = await uploadFile(req.file);
		return response;
	};

	const imageResult = req.file ? await uploadImage() : '';

	try {
		const userProfile = new Profile({
			_id: new mongoose.Types.ObjectId(),
			firstName: req.body?.firstName,
			middleName: req.body?.middleName,
			lastName: req.body?.lastName,
			phoneNumber: req.body?.phoneNumber,
			gender: req.body?.gender?.toLowerCase(),
			profilePicture: req.file ? imageResult?.Location : '',
			nationality: req.body?.nationality?.toLowerCase(),
			dob: req.body?.dob,
			user: authenticatedUser._id
		});

		return userProfile
			.save()
			.then(() =>
				res.status(201).json({
					status: 201,
					message: 'User profile created successfully'
				})
			)
			.catch(error => {
				return res.status(500).json({ error, message: 'Unable to save user profile details', status: 500 });
			});
	} catch (error) {
		return res.status(400).json({ error, message: 'Incorrect details. Try again', status: 400 });
	}
};

const getAllUsersProfile = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Profile.find()
			.select('firstName middleName lastName gender profilePicture nationality dob')
			.populate({ path: 'user', select: 'username email' })
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all users profiles', total: result.length, profiles: result, status: 200 });
				} else {
					res.status(404).json({ message: 'No user profile found', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'Cannot retrieve user profiles', status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const getCurrentUserProfile = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Profile.findOne({ user: authenticatedUser._id })
		.select('firstName middleName lastName gender profilePicture nationality dob')
		.populate({ path: 'user', select: 'username email' })
		.exec()
		.then(userProfile => {
			if (userProfile) return res.status(200).json({ userProfile, message: 'Successfully fetched user profile', status: 200 });

			return res.status(404).json({ message: 'User is yet to to add profile details', status: 404 });
		})
		.catch(error => {
			res.status(500).json({ error, message: 'No valid entry found', status: 500 });
		});
};

const getUserProfileDetails = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const id = req.params.profileId;

		Profile.findOne({ $or: [{ _id: id }, { user: id }] })
			.select('firstName middleName lastName gender profilePicture nationality dob')
			.populate({ path: 'user', select: 'username email' })
			.exec()
			.then(userProfile => {
				if (!userProfile) return res.status(404).json({ message: 'No valid entry found', status: 404 });

				return res.status(200).json({ userProfile, status: 200 });
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

const editUserProfile = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	for (const property in req.body) {
		if (req.body[property] === null || req.body[property] === undefined) {
			delete req.body[property];
		}
	}

	const findUser = await Profile.findOne({ user: authenticatedUser?._id });
	if (!findUser) return res.status(400).json({ message: 'You have not added your profile details', status: 400 });

	Profile.updateOne({ user: authenticatedUser._id }, { $set: { ...req.body } })
		.exec()
		.then(() => {
			res.status(200).json({ message: 'Successfully updated user profile', status: 200 });
		})
		.catch(error => {
			res.status(500).json({ message: 'Unable to update user profile', error, status: 500 });
		});
};

const updateProfileImage = async (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (!req.file) return res.status(400).json({ message: 'No image selected', status: 400 });

	const uploadImage = async () => {
		const response = await uploadFile(req.file);
		return response;
	};

	const imageResult = await uploadImage();

	Profile.updateOne({ user: authenticatedUser._id }, { $set: { profilePicture: imageResult.Location } })
		.exec()
		.then(() => {
			res.status(200).json({ message: 'Successfully updated profile picture', status: 200 });
		})
		.catch(error => {
			res.status(500).json({ message: 'Unable to update profile picture', error, status: 500 });
		});
};

const deleteUserProfile = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const id = req.params.id;

		Profile.findOne({ $or: [{ _id: id }, { user: id }] })
			.exec()
			.then(user => {
				user.deleteOne((error, success) => {
					if (error) {
						return res.status(500).json({ error, message: 'Unable to delete user profile', status: 500 });
					}
					res.status(200).json({ message: 'User successfully deleted', status: 200 });
				});
			})
			.catch(error => {
				res.status(404).json({ error, message: 'User does not exist', status: 404 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
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
