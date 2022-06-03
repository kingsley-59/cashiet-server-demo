const User = require('../models/user');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const generateToken = user => {
	const token = jwt.sign({ user }, process.env.JWT_KEY, {
		expiresIn: '7d'
	});

	return token;
};

const oauthRegistration = async (req, res, next) => {
	const { email } = req.body;

	User.findOne({ email })
		.then(userData => {
			if (userData) {
				if (userData.modeOfRegistration === 'oauth') {
					const token = generateToken(userData);

					return res.status(200).json({
						message: 'Authentication Successful',
						user: userData,
						token
					});
				}

				return res.status(400).json({ message: 'Account exists already. Log in with username and password' });
			}

			const newUser = new User({
				_id: new mongoose.Types.ObjectId(),
				email,
				modeOfRegistration: 'oauth',
				isVerified: true
			});

			newUser
				.save()
				.then(user => {
					const token = generateToken(newUser);

					return res.status(200).json({ message: 'Account created successfully', token, user });
				})
				.catch(error => res.status(500).json({ message: 'Unable to save user details', error }));
		})
		.catch(error => {
			return res.status(500).json({ error });
		});
};

module.exports = {
	oauthRegistration
};
