const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const Profile = require('../models/profile');
const Token = require('../models/token');
const { sendEmail } = require('../mail/mailjet');
const getUsername = require('../../utility/getName');
const profile = require('../models/profile');
const address = require('../models/address');

// create a function that returns a secured token
const generateToken = (userId, username, email, role) => {
	const token = jwt.sign({ user: { username, email, role: role, _id: userId } }, process.env.JWT_KEY, {
		expiresIn: '3d'
	});
	return token;
};

const userSignup = async (req, res, next) => {
	User.findOne({ $or: [{ email: req.body?.email }, { username: req.body?.username }] })
		.exec()
		.then(newUser => {
			if (newUser) {
				return res.status(409).json({ message: 'User with that email or username already exist', status: 409 });
			} else {
				bcrypt.hash(req.body.password, 10, (error, hash) => {
					if (error) {
						return res.status(500).json({ error });
					} else {
						try {
							const user = new User({
								_id: new mongoose.Types.ObjectId(),
								email: req.body?.email?.toLowerCase(),
								username: req.body?.username?.toLowerCase(),
								password: hash
							});

							return user
								.save()
								.then(newUser => {
									const token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
									const username = getUsername(req.body?.email);
									return token
										.save()
										.then(() => {
											const link = `${process.env.BASE_URL}/confirm-email/${token.token}`;
											const messageToSend = `
											<!DOCTYPE html>
											<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
												<head>
													<meta charset="UTF-8" />
													<link href="./fonts/fonts.css" rel="stylesheet" />
													<meta http-equiv="X-UA-Compatible" content="IE=edge" />
													<meta name="viewport" content="width=device-width, initial-scale=1.0" />
													<meta name="x-apple-disable-message-reformatting" />
													<title>Welcome to Cashiet</title>
													<style>
														* {
															margin: 0;
															padding: 0;
															box-sizing: border-box;
														}
														body {
															background-color: #ffffff;
															font-family: "Axiforma";
														}
													</style>
												</head>
												<body style="margin: 0; padding: 0">
													<table
														role="presentation"
														style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background: #ffffff; margin-top: 20px; margin-bottom: 20px"
													>
														<tr>
															<td align="center" style="padding: 0">
																<table
																	role="presentation"
																	style="min-width: 375px; border-collapse: collapse; border: 1px solid #cccccc; background-color: green; border-spacing: 0; text-align: left"
																>
																	<tr>
																		<td style="background: #fff; padding-top: 20px">
																			<img
																				src="https://res.cloudinary.com/djwa4cx9u/image/upload/v1655999355/cashiet_z3i27q.png"
																				alt="Cashiet Logo"
																				style="height: auto; display: block; width: 100%; max-width: 200px; margin: 10px auto"
																			/>
																		</td>
																	</tr>
																	<tr style="float: right; min-width: 344.8px">
																		<td style="padding: 36px 30px 42px 30px; max-width: 329px; background-color: green">
																			<table role="presentation" style="width: 100%; color: #fff; border-collapse: collapse; border: 0; border-spacing: 0">
																				<tr>
																					<td style="padding: 0 0 36px 0; color: #fff">
																						<p style="font-size: 26.3px; margin: 0 0 29px 0; max-width: 232px; font-weight: 900; line-height: 36px">
																							Welcome to Cashiet!
																						</p>
																						<p style="margin: 0 0 29px 0; font-size: 14.5px; line-height: 24px">Hi ${username || 'User'},</p>
																						<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">
																							You're in! We're excited to have you here!
																						</p>
																						<p style="margin: 0 0 29px 0; width: 245px; font-size: 14.5px; line-height: 25px">
																							You just created an account on Cashiet. Kindly verify your email address.
																						</p>
																						<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">Alternatively, you can also copy and paste this link in a web browser <span style="color: #fff000">${link}</span></p>
																						<a href=${link}>
																							<button
																								style="
																									margin: 0 0 43px 0;
																									font-family: 'Axiforma';
																									width: 269px;
																									height: 67px;
																									border-radius: 52px;
																									border: none;
																									background-color: #fff;
																									color: #fff000;
																									font-size: 14.3px;
																									line-height: 15px;
																									font-weight: 600;
																								"
																							>
																								Confirm email address
																							</button>
																						</a>
																						<p style="margin: 0 0 0px 0; width: 260px; font-size: 8.3px; font-weight: 400; line-height: 15px; color: #fff000">
																							You’re receiving this email because you signed up with your email address. If you have any inquiry or feedback on Cashiet,
																							feel free to drop a line at enquiry@cashiet.com. Remember to follow us on
																							<span style="text-decoration: underline">social media</span> for more updates!
																						</p>
																					</td>
																				</tr>
																			</table>
																		</td>
																	</tr>
																	<tr></tr>
																</table>
															</td>
														</tr>
													</table>
												</body>
											</html>
											
											`;
											sendEmail(
												req.body.email,
												'user',
												'Welcome to Cashiet. Kindly verify your account',
												`Hello, Please verify your account by clicking the ${link}`,
												messageToSend
											);

											return res.status(201).json({
												status: 201,
												message: 'Account created successfully. Proceed to verify  your email address.'
												// token
												// newUser,
											});
										})
										.catch(error => {
											return res.status(500).json({
												status: 500,
												message: 'Unable to save token. Kindly verify your email address ' + req.body.email,
												error
												// newUser,
											});
										});
								})
								.catch(error => {
									return res.status(400).json({ error, status: 400 });
								});
						} catch (error) {
							return res.status(400).json({ error, message: 'Check your details and try again', status: 400 });
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

	if (authenticatedUser?.role === 'superadmin' || authenticatedUser?.role === 'admin') {
		User.find()
			.select('username email role isVerified modeOfRegistration')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({
						status: 200,
						message: 'Successfully fetched all users',
						total: result.length,
						users: res.paginatedResults
					});
				} else {
					res.status(404).json({ status: 404, message: 'No users found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else return res.status(401).json({ status: 401, message: 'Unauthorized access' });
};

const userLogin = async (req, res, next) => {
	User.findOne({ email: req.body.email })
		.exec()
		.then(user => {
			if (!user || user?.role !== 'user') {
				return res.status(401).json({ status: 401, message: 'User not found' });
			}

			bcrypt.compare(req.body.password, user?.password, async (error, result) => {
				if (error) {
					return res.status(401).json({ status: 401, message: 'Authentication failed', error });
				}

				if (result) {
					if (!user?.isVerified) {
						return res.status(400).json({ status: 400, message: 'You have not verified your email address' });
					}

					const token = generateToken(user?._id, user?.username, user?.email, user?.role);

					res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); // expires in 30days

					const findUserProfile = await Profile.findOne({ user: user?._id }).select(
						'firstName middleName lastName gender profilePicture nationality dob phoneNumber address'
					);

					return res.status(200).json({
						status: 200,
						message: 'Authentication Successful',
						username: user?.username,
						email: user?.email,
						userId: user?._id,
						token,
						userProfile: findUserProfile
					});
				}
				res.status(401).json({ status: 401, message: 'Invalid credentials' });
			});
		})
		.catch(error => {
			res.status(404).json({ error, message: 'Unable to find user', status: 404 });
		});
};

const getCurrentUser = (req, res, next) => {
	User.findById(req.decoded.user._id)
		.select('username email role isVerified modeOfRegistration')
		.exec()
		.then(user => {
			res.status(200).json({
				status: 200,
				message: 'Successfully fetched user',
				user
			});
		})
		.catch(error => {
			res.status(500).json({ error, message: 'No valid entry found', status: 500 });
		});
};

const getUserDetails = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		const id = req.params.userId;
		User.findById(id)
			.select('username email role isVerified modeOfRegistration')
			.exec()
			.then(user => {
				if (user) {
					res.status(200).json({ user, status: 200 });
				} else {
					res.status(404).json({ message: 'No valid entry found', status: 400 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const editUser = (req, res, next) => {
	const id = req.params.userId;

	for (const property in req.body) {
		if (req.body[property] === null || req.body[property] === undefined) {
			delete req.body[property];
		}

		if (property === 'email') {
			return res.status(500).json({ error: { message: 'You cannot edit the email address', status: 500 } });
		}

		if (property === 'username') {
			return res.status(500).json({ error: { message: 'You cannot edit the user name', status: 500 } });
		}
	}

	User.updateOne({ _id: id }, { $set: { ...req.body } })
		.exec()
		.then(() => {
			res.status(200).json({ message: 'Successfully updated user details', status: 200 });
		})
		.catch(error => {
			res.status(500).json({ message: 'Unable to update user details', error, status: 500 });
		});
};

const deleteUser = (req, res, next) => {
	const id = req.params.userId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		User.findById({ _id: id })
			.exec()
			.then(async user => {
				if (user) {
					await profile.deleteMany({ user: user?._id });
					await address.deleteMany({ user: user?._id });

					user.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error, status: 500, message: 'Unable to delete user' });
						}
						res.status(200).json({ message: 'User successfully deleted', status: 200 });
					});
				} else {
					res.status(404).json({ message: 'User does not exist', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'Unable to find user', status: 500 });
			});
	} else return res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const confirmEmail = (req, res) => {
	Token.findOne({ token: req.params?.emailToken }, function (error, token) {
		if (!token)
			return res
				.status(400)
				.json({ type: 'not-verified', error, message: 'We were unable to find a valid token. Your token may have expired.', status: 400 });

		// If we found a token, find a matching user
		User.findOne({ _id: token._userId }, function (err, user) {
			if (!user) return res.status(404).json({ message: 'We were unable to find a user for this token.', status: 404 });
			if (user?.isVerified)
				return res.status(400).json({ type: 'already-verified', message: 'This user has already been verified.', status: 400 });

			// Verify and save the user
			user.isVerified = true;
			user.save(function (error) {
				if (error) {
					return res.status(500).json({ message: error?.message, error, status: 500 });
				}
				res.status(200).json({ message: 'Verification successful. Please proceed to log in.', status: 200 });
			});
		});
	});
};

const resendEmailToken = async (req, res, next) => {
	User.findOne({ email: req.body.email }, function (err, user) {
		if (!user) return res.status(404).json({ message: 'We were unable to find a user with that email.', status: 404 });
		if (user?.isVerified) return res.status(400).json({ message: 'This account has already been verified. Please log in.', status: 400 });

		// Create a verification token, save it, and send email
		var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });
		const username = getUsername(req.body?.email);
		// Save the token
		token.save(function (error) {
			if (error) {
				return res.status(500).json({ message: error.message, error, status: 500 });
			}

			const link = `${process.env.BASE_URL}/confirm-email/${token.token}`;

			const messageToSend = `
			<!DOCTYPE html>
			<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
				<head>
					<meta charset="UTF-8" />
					<link href="./fonts/fonts.css" rel="stylesheet" />
					<meta http-equiv="X-UA-Compatible" content="IE=edge" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<meta name="x-apple-disable-message-reformatting" />
					<title>Document</title>
					<style>
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						body {
							background-color: #FFFFFF;
							font-family: "Axiforma";
						}
					</style>
				</head>
				<body style="margin: 0; padding: 0">
					<table
						role="presentation"
						style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background: #FFFFFF; margin-top: 20px; margin-bottom: 20px"
					>
						<tr>
							<td align="center" style="padding: 0">
								<table
									role="presentation"
									style="min-width: 375px; border-collapse: collapse; border: 1px solid #CCCCCC; background-color: green; border-spacing: 0; text-align: left"
								>
									<tr>
										<td style="background: #fff; padding-top: 20px">
											<img
												src="https://res.cloudinary.com/djwa4cx9u/image/upload/v1655999355/cashiet_z3i27q.png"
												alt="Cashiet Logo"
												style="height: auto; display: block; width: 100%; max-width: 200px; margin: 10px auto"
											/>
										</td>
									</tr>
									<tr style="float: right; min-width: 344.8px">
										<td style="padding: 36px 30px 42px 30px; max-width: 329px; background-color: green">
											<table role="presentation" style="width: 100%; color: #fff; border-collapse: collapse; border: 0; border-spacing: 0">
												<tr>
													<td style="padding: 0 0 36px 0; color: #fff">
														<p style="font-size: 26.3px; margin: 0 0 29px 0; max-width: 232px; font-weight: 900; line-height: 36px">Verify Email Address</p>
														<p style="margin: 0 0 29px 0; font-size: 14.5px; line-height: 24px">Hi ${username || 'User'},</p>
														<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">
															Kindly use the link provided below to verify your email address.
														</p>
														<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">You can also copy and paste this link <span style="color: #fff000">${link}</span> into your browser</p>
														<a href=${link}>
															<button
																style="
																	margin: 0 0 43px 0;
																	font-family: 'Axiforma';
																	width: 269px;
																	height: 67px;
																	border-radius: 52px;
																	border: none;
																	background-color: #fff;
																	color: #fff000;
																	font-size: 14.3px;
																	line-height: 15px;
																	font-weight: 600;
																"
															>
																Verify Email Address
															</button>
														</a>
														<p style="margin: 0 0 0px 0; width: 260px; font-size: 8.3px; font-weight: 400; line-height: 15px; color: #FFF000">
															You’re receiving this email because you signed up with your email address. If you have any inquiry or feedback on Cashiet,
															feel free to drop a line at enquiry@cashiet.com. Remember to follow us on
															<span style="text-decoration: underline">social media</span> for more updates!
														</p>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr></tr>
								</table>
							</td>
						</tr>
					</table>
				</body>
			</html>
			`;

			// Send the email
			sendEmail(
				req.body.email,
				'user',
				'Account Verification Link',
				`Hello, Please verify your account by clicking the ${link}`,
				messageToSend
			);

			res.status(200).json({ message: 'A verification email has been sent to ' + user.email + '.', status: 200 });
		});
	});
};

const createAdmin = async (req, res) => {
	const authenticatedUser = req.decoded.user;
	if (authenticatedUser.role === 'superadmin') {
		User.find({ email: req.body.email })
			.exec()
			.then(newUser => {
				if (newUser.length >= 1) {
					return res.status(409).json({ message: 'User with that email already exist', status: 409 });
				} else {
					bcrypt.hash(req.body.password, 10, (error, hash) => {
						if (error) {
							return res.status(500).json({ error, status: 500 });
						} else {
							try {
								const user = new User({
									_id: new mongoose.Types.ObjectId(),
									email: req.body.email?.toLowerCase(),
									username: req.body?.username.toLowerCase(),
									password: hash,
									role: 'admin',
									isVerified: true
								});

								return user
									.save()
									.then(() => {
										const token = generateToken(user?._id, user?.username, user?.email, user?.role);

										res.cookie('token', token, { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 }); // expires in 3days

										res.status(201).json({
											message: 'Admin created successfully',
											status: 201,
											username: req.body?.username.toLowerCase(),
											email: req.body?.email.toLowerCase(),
											token
										});
									})

									.catch(error => {
										return res.status(500).json({ error, message: 'Unable to save user details', status: 500 });
									});
							} catch (error) {
								return res.status(500).json({ error, message: 'Check your details and try again', status: 500 });
							}
						}
					});
				}
			})
			.catch(error => {
				res.status(500).json({ error, status: 500 });
			});
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
};

const adminLogin = async (req, res, next) => {
	User.findOne({ email: req.body.email })
		.exec()
		.then(user => {
			if (!user || user?.role === 'user') {
				return res.status(401).json({ status: 401, message: 'User not found' });
			}

			bcrypt.compare(req.body.password, user?.password, async (error, result) => {
				if (error) {
					return res.status(401).json({ status: 401, message: 'Authentication failed', error });
				}

				if (result) {
					const token = jwt.sign(
						{ user: { username: user?.username, email: user?.email, role: user?.role, _id: user?._id } },
						process.env.JWT_KEY,
						{
							expiresIn: '7d'
						}
					);

					res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); // expires in 30days

					const findUserProfile = await Profile.findOne({ user: user?._id }).select(
						'firstName middleName lastName gender profilePicture nationality dob phoneNumber address'
					);

					return res.status(200).json({
						status: 200,
						message: 'Authentication Successful',
						username: user?.username,
						email: user?.email,
						userId: user?._id,
						token,
						userProfile: findUserProfile
					});
				}
				res.status(401).json({ status: 401, message: 'Invalid credentials' });
			});
		})
		.catch(error => {
			res.status(404).json({ error, message: 'Unable to find user', status: 404 });
		});
};

const testEmail = (req, res, next) => {
	try {
		const messageToSend = `
		<!DOCTYPE html>
		<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
			<head>
				<meta charset="UTF-8" />
				<link href="./fonts/fonts.css" rel="stylesheet" />
				<meta http-equiv="X-UA-Compatible" content="IE=edge" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta name="x-apple-disable-message-reformatting" />
				<title>Document</title>
				<style>
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
		
					body {
						background-color: #ffffff;
						font-family: "Axiforma";
					}
				</style>
			</head>
			<body style="margin: 0; padding: 0">
				<table
					role="presentation"
					style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background: #ffffff; margin-top: 20px; margin-bottom: 20px"
				>
					<tr>
						<td align="center" style="padding: 0">
							<table
								role="presentation"
								style="min-width: 375px; border-collapse: collapse; border: 1px solid #cccccc; background-color: green; border-spacing: 0; text-align: left"
							>
								<tr>
									<td style="background: #fff; padding-top: 20px">
										<img
											src="https://res.cloudinary.com/djwa4cx9u/image/upload/v1655999355/cashiet_z3i27q.png"
											alt="Cashiet Logo"
											style="height: auto; display: block; width: 100%; max-width: 200px; margin: 10px auto"
										/>
									</td>
								</tr>
								<tr style="float: right; min-width: 344.8px">
									<td style="padding: 36px 30px 42px 30px; max-width: 329px; background-color: green">
										<table role="presentation" style="width: 100%; color: #fff; border-collapse: collapse; border: 0; border-spacing: 0">
											<tr>
												<td style="padding: 0 0 36px 0; color: #fff">
													<p style="font-size: 26.3px; margin: 0 0 29px 0; max-width: 232px; font-weight: 900; line-height: 36px">Verify Email Address</p>
													<p style="margin: 0 0 29px 0; font-size: 14.5px; line-height: 24px">Hi Joshua,</p>
													<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">
														Hello, Kindly use the link provided below to verify your email address.
													</p>
													<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">You can also copy and paste this link into your browser</p>
													<a href="https://www.cashiet.com">
														<button
															style="
																margin: 0 0 43px 0;
																font-family: 'Axiforma';
																width: 269px;
																height: 67px;
																border-radius: 52px;
																border: none;
																background-color: #fff;
																color: #fff000;
																font-size: 14.3px;
																line-height: 15px;
																font-weight: 600;
															"
														>
															Verify Email Address
														</button>
													</a>
													<p style="margin: 0 0 0px 0; width: 260px; font-size: 8.3px; font-weight: 400; line-height: 15px; color: #fff000">
														You’re receiving this email because you signed up with your email address. If you have any inquiry or feedback on Cashiet,
														feel free to drop a line at enquiry@cashiet.com. Remember to follow us on
														<span style="text-decoration: underline">Twitter</span> for more updates!
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								<tr></tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
		</html>
		
		`;
		sendEmail('oyelekeoluwasayo@gmail.com', 'Joshua', 'Testing', 'Just testing', messageToSend);

		res.status(200).json({ message: 'Sent' });
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Unable to send email', error });
	}
};

const userLogout = (req, res) => {
	res.cookie('token', '', { maxAge: 1 });
	return res.status(200).json({ message: 'Logged out successfully', status: 200 });
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
	createAdmin,
	testEmail,
	userLogout,
	adminLogin
};
