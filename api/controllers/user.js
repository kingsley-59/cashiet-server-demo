const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const Token = require('../models/token');
const { sendEmail } = require('../mail');

const userSignup = (req, res, next) => {
	User.find({ email: req.body.email })
		.exec()
		.then(newUser => {
			console.log(newUser);
			if (newUser.length >= 1) {
				return res.status(409).json({ message: 'User with that email already exist' });
			} else {
				bcrypt.hash(req.body.password, 10, (error, hash) => {
					if (error) {
						return res.status(500).json({ error });
					} else {
						try {
							const user = new User({
								_id: new mongoose.Types.ObjectId(),
								email: req.body.email.toLowerCase(),
								password: hash,
								role: req.body.role || 'user'
							});

							return user
								.save()
								.then(newUser => {
									const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
									return token
										.save()
										.then(() => {
											sendEmail(
												req.body.email,
												'Account Verification Link',
												`Hello,\n\nPlease verify your account by clicking the <a href="${process.env.BASE_URL}/confirm-email/${token.token}">link</a> or copy this link into your browser:\n${process.env.BASE_URL}/confirm-email/${token.token}\n`
											);

											return res.status(201).json({
												message: 'Account created successfully',
												token
												// newUser,
											});
										})
										.catch(error => {
											return res.status(500).json({
												message: 'Unable to save token. Kindly verify your email address ' + req.body.email,
												error
												// newUser,
											});
										});
								})
								.catch(error => {
									return res.status(500).json({ error });
								});
						} catch (error) {
							return res.status(500).json({ error, message: 'Check your details and try again' });
						}
					}
				});
			}
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const getAllUsers = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		User.find()
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all users', total: result.length, users: result });
				} else {
					res.status(404).json({ message: 'No users found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const userLogin = (req, res, next) => {
	User.find({ email: req.body.email })
		.exec()
		.then(user => {
			if (user.length < 1) {
				return res.status(401).json({ message: 'Authentication failed' });
			}

			bcrypt.compare(req.body.password, user[0].password, (error, result) => {
				if (error) {
					return res.status(401).json({ message: 'Authentication failed' });
				}
				if (result) {
					if (!user[0].isVerified) {
						return res.status(400).json({ message: 'You have not verified your email address' });
					}

					const token = jwt.sign({ user: user[0] }, process.env.JWT_KEY, {
						expiresIn: '7d'
					});

					return res.status(200).json({
						message: 'Authentication Successful',
						user: user[0],
						// user: {
						//   id: user[0]._id,
						//   username: user[0].username,
						//   email: user[0].email,
						//   role: user[0].role,
						// },
						token
					});
				}
				res.status(401).json({ message: 'Authentication failed' });
			});
		})
		.catch(error => {
			res.status(500).json({ error });
		});
};

const getCurrentUser = (req, res, next) => {
	User.findById(req.decoded.user._id)
		.exec()
		.then(user => {
			res.status(200).json(user);
		})
		.catch(error => {
			res.status(500).json({ error, message: 'No valid entry found' });
		});
};

const getUserDetails = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		const id = req.params.userId;
		User.findById(id)
			.exec()
			.then(user => {
				if (user) {
					res.status(200).json(user);
				} else {
					res.status(404).json({ message: 'No valid entry found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const editUser = (req, res, next) => {
	const id = req.params.userId;

	for (const property in req.body) {
		if (req.body[property] === null || req.body[property] === undefined) {
			delete req.body[property];
		}

		if (property === 'email') {
			return res.status(500).json({ error: { message: 'You cannot edit the email address' } });
		}

		if (property === 'userName') {
			return res.status(500).json({ error: { message: 'You cannot edit the user name' } });
		}
	}

	User.updateOne({ _id: id }, { $set: { ...req.body } })
		.exec()
		.then(user => {
			res.status(200).json({ message: 'Successfully updated user details', user });
		})
		.catch(error => {
			res.status(500).json({ message: 'Unable to update user details', error });
		});
};

const deleteUser = (req, res, next) => {
	const id = req.params.userId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		User.findById({ _id: id })
			.exec()
			.then(user => {
				if (user) {
					user.deleteOne((error, success) => {
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

const confirmEmail = (req, res) => {
	Token.findOne({ token: req.params.emailToken }, function (error, token) {
		if (!token)
			return res
				.status(400)
				.json({ type: 'not-verified', error, message: 'We were unable to find a valid token. Your token my have expired.' });

		// If we found a token, find a matching user
		User.findOne({ _id: token._userId }, function (err, user) {
			if (!user) return res.status(400).json({ message: 'We were unable to find a user for this token.' });
			if (user.isVerified) return res.status(400).json({ type: 'already-verified', message: 'This user has already been verified.' });

			// Verify and save the user
			user.isVerified = true;
			user.save(function (error) {
				if (error) {
					return res.status(500).json({ message: error.message, error });
				}
				res.status(200).json({ message: 'Verification successful. Please proceed to log in.' });
			});
		});
	});
};

const resendEmailToken = (req, res) => {
	User.findOne({ email: req.body.email }, function (err, user) {
		if (!user) return res.status(400).json({ message: 'We were unable to find a user with that email.' });
		if (user.isVerified) return res.status(400).json({ message: 'This account has already been verified. Please log in.' });

		// Create a verification token, save it, and send email
		var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

		// Save the token
		token.save(function (error) {
			if (error) {
				return res.status(500).json({ message: error.message, error });
			}

			// Send the email
			sendEmail(
				req.body.email,
				'Account Verification Link',
				`Hello,\n\nPlease verify your account by clicking the <a href="${process.env.BASE_URL}/confirm-email/${token.token}">link</a> or copy this link into your browser:\n${process.env.BASE_URL}/confirm-email/${token.token}\n`
			);

			res.status(200).json({ message: 'A verification email has been sent to ' + user.email + '.' });
		});
	});
};

const createAdmin = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin' || authenticatedUser.role === 'superadmin') {
		User.find({ email: req.body.email })
			.exec()
			.then(newUser => {
				if (newUser.length >= 1) {
					return res.status(409).json({ message: 'User with that email already exist' });
				} else {
					bcrypt.hash(req.body.password, 10, (error, hash) => {
						if (error) {
							return res.status(500).json({ error });
						} else {
							try {
								const user = new User({
									_id: new mongoose.Types.ObjectId(),
									email: req.body.email.toLowerCase(),
									password: hash,
									role: 'admin',
									isVerified: true
								});

								return user
									.save()
									.then(newUser => {
										return res.status(201).json({
											message: 'Account created successfully',
											newUser
										});
									})
									.catch(error => {
										return res.status(500).json({ error });
									});
							} catch (error) {
								return res.status(500).json({ error, message: 'Check your details and try again' });
							}
						}
					});
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else res.status(401).json({ message: 'Unauthorized access' });
};

module.exports = {
	userSignup,
	getAllUsers,
	userLogin,
	getCurrentUser,
	getUserDetails,
	editUser,
	deleteUser,
	confirmEmail,
	resendEmailToken,
	createAdmin
};
