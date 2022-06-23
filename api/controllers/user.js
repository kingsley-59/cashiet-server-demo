const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const Token = require('../models/token');
const { sendEmail } = require('../mail/mailjet');
const getUsername = require('../../utility/getName');

const userSignup = (req, res, next) => {
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

	if (authenticatedUser?.role === 'superadmin' || authenticatedUser?.role === 'admin') {
		User.find()
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({
						message: 'Successfully fetched all users',
						total: result.length,
						// users: result,
						users: res.paginatedResults
					});
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

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
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
		const username = getUsername(req.body?.email);
		// Save the token
		token.save(function (error) {
			if (error) {
				return res.status(500).json({ message: error.message, error });
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

			res.status(200).json({ message: 'A verification email has been sent to ' + user.email + '.' });
		});
	});
};

const createAdmin = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin') {
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
	testEmail
};
