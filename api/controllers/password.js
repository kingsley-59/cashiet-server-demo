const User = require('../models/user');
const Token = require('../models/token');
const { sendEmail } = require('../mail/mailjet');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const sendPasswordResetLink = async (req, res) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		if (!user) return res.status(400).json({ message: "user with given email doesn't exist" });

		let token = await Token.findOne({ _userId: user._id });

		if (!token) {
			token = await new Token({
				_userId: user._id,
				token: crypto.randomBytes(32).toString('hex')
			}).save();
		}

		const link = `${process.env.BASE_URL}/password-reset?user=${user._id}&token=${token.token}`;

		const messageToSend = `
			<html>
				<h1>Hello user,</h1>
				<p>Please, kindly click on this <a href="${link}" to verify your account or copy and paste ${link} in a browser</p>
				<br /><br />
				<h3>Best regards</h3>
				<p>Cashiet</p>
			</html>
		`;

		await sendEmail(
			user.email,
			'user',
			'Password reset link',
			`Kindly click on this link to verify your account or copy and paste it in a browser ${link}`,
			messageToSend
		);

		res.status(200).json({ message: 'Password reset link sent to your email account' });
	} catch (error) {
		res.status(500).json({ message: 'An error occured' });
	}
};

const resetPassword = async (req, res) => {
	try {
		const user = await User.findById({ _id: req.body.userId });
		if (!user) return res.status(400).json({ message: 'Invalid link or expired' });

		const token = await Token.findOne({
			_userId: user._id,
			token: req.body.token,
			password: req.body.password
		});

		console.log(token);

		if (!token) return res.status(400).send({ json: 'Invalid link or expired' });

		bcrypt.hash(req.body.password, 10, async (error, hash) => {
			if (error) {
				return res.status(500).json({ message: 'Unable to save new password' });
			}

			user.password = hash;

			await user.save();
			await token.delete();

			res.status(200).json({ message: 'Password updated successfully.' });
		});
	} catch (error) {
		res.status(500).json({ message: 'An error occured' });
		console.log(error);
	}
};

const changePassword = async (req, res) => {
	const authenticatedUser = req.decoded.user;

	try {
		const user = await User.findById({ _id: authenticatedUser._id });
		if (!user) return res.status(400).json({ message: 'User does not exist' });

		bcrypt.hash(req.body.newPassword, 10, async (error, hash) => {
			if (error) {
				return res.status(500).json({ message: 'Unable to save new password' });
			}

			user.password = hash;

			await user.save();

			res.status(200).json({ message: 'Password updated successfully.' });
		});
	} catch (error) {
		res.status(500).json({ message: 'An error occured' });
		console.log(error);
	}
};

module.exports = {
	sendPasswordResetLink,
	resetPassword,
	changePassword
};
