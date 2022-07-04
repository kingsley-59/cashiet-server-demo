const User = require('../models/user');
const Token = require('../models/token');
const { sendEmail } = require('../mail/mailjet');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const getUsername = require('../../utility/getName');

const sendPasswordResetLink = async (req, res) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) return res.status(400).json({ message: "user with given email doesn't exist", status: 400 });

		let token = await Token.findOne({ _userId: user._id });

		if (!token) {
			token = await new Token({
				_userId: user._id,
				token: crypto.randomBytes(32).toString('hex')
			}).save();
		}

		const link = `${process.env.BASE_URL}/password-reset?user=${user._id}&token=${token.token}`;
		const username = getUsername(req.body?.email);

		const messageToSend = `
		<!DOCTYPE html>
		<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
			<head>
				<meta charset="UTF-8" />
				<link href="./fonts/fonts.css" rel="stylesheet" />
				<meta http-equiv="X-UA-Compatible" content="IE=edge" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta name="x-apple-disable-message-reformatting" />
				<title>Reset Password</title>
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
													<p style="font-size: 26.3px; margin: 0 0 29px 0; max-width: 232px; font-weight: 900; line-height: 36px">Reset Password</p>
													<p style="margin: 0 0 29px 0; font-size: 14.5px; line-height: 24px">Hi ${username},</p>
													<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">
														You have requested to reset your password. Kindly use the link provided below to do so.
													</p>
													<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">
														You can also copy and paste this link <span style="color: white">${link}</span> into your browser
													</p>
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
																color: green;
																font-size: 14.3px;
																line-height: 15px;
																font-weight: 600;
															"
														>
															Reset Password
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

		await sendEmail(
			user.email,
			'user',
			'Password reset link',
			`Kindly click on this link to verify your account or copy and paste it in a browser <span style="color: #fff000">${link}</span>`,
			messageToSend
		);

		res.status(200).json({ message: 'Password reset link sent to your email account', status: 200 });
	} catch (error) {
		res.status(500).json({ message: 'An error occured', status: 500 });
	}
};

const resetPassword = async (req, res) => {
	try {
		const user = await User.findById({ _id: req.body.userId });
		if (!user) return res.status(400).json({ message: 'User with that id not found', status: 400 });

		const token = await Token.findOne({
			_userId: user._id,
			token: req.body.token,
			password: req.body.password
		});

		if (!token) return res.status(400).json({ message: 'Invalid link or expired', status: 500 });

		bcrypt.hash(req.body.password, 10, async (error, hash) => {
			if (error) {
				return res.status(500).json({ message: 'Unable to save new password' });
			}

			user.password = hash;

			await user.save();
			await token.delete();

			res.status(200).json({ message: 'Password updated successfully.', status: 200 });
		});
	} catch (error) {
		res.status(500).json({ message: 'An error occured', status: 500 });
		console.log(error);
	}
};

const changePassword = async (req, res) => {
	const authenticatedUser = req.decoded.user;

	try {
		const user = await User.findById({ _id: authenticatedUser._id });
		if (!user) return res.status(400).json({ message: 'User does not exist', status: 400 });

		bcrypt.hash(req.body.newPassword, 10, async (error, hash) => {
			if (error) {
				return res.status(500).json({ message: 'Unable to save new password', status: 500 });
			}

			user.password = hash;

			await user.save();

			res.status(200).json({ message: 'Password updated successfully.', status: 200 });
		});
	} catch (error) {
		res.status(500).json({ message: 'An error occured', status: 500 });
		console.log(error);
	}
};

module.exports = {
	sendPasswordResetLink,
	resetPassword,
	changePassword
};
