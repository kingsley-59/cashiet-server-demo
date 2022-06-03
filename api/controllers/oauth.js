const User = require('../models/user');
// import { OAuth2Client } from "google-auth-library";

const googleAuth = (req, res, next) => {
	// const { token } = req.body;

	// const ticket = await googleClient.verifyIdToken({
	//   idToken: token,
	//   audient: `${process.env.GOOGLE_OAUTH_CLIENT_ID}`,
	// });

	// const payload = ticket.getPayload();

	// let user = await User.findOne({ email: payload?.email });

	// if (!user) {
	//   user = await new User({
	//     email: payload?.email,
	//     avatar: payload?.picture,
	//     name: payload?.name,
	//     isVerified: true
	//   });

	//   await user.save();
	// }

	// res.json({ user, token });
	res.status(200).send('Working');
};

module.exports = {
	googleAuth
};
