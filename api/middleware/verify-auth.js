const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const authHeader = req.headers?.authorization;

	let result;

	if (authHeader) {
		const token = req.headers['authorization'].split(' ')[1]; // Bearer <token>
		const options = {
			expiresIn: '3d',
			issues: 'https://cashiet.com'
		};

		try {
			// verify if token hasn't expired and it's issued by cashiet
			result = jwt.verify(token, process.env.JWT_KEY, options);

			// pass back the decoded token to the request object
			req.decoded = result;

			// pass execution to the next middleware
			next();
		} catch (error) {
			console.log('Error error error error error error', error);
			// throw an error if anything goes wrong with the verification
			throw new Error(error);
		}
	} else {
		result = {
			error: 'Authentication error. Token required',
			status: 401
		};
		res.status(401).json(result);
	}
};
