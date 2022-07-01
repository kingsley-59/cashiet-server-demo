const { generateError } = require('../../utility/generateError');

const validateUserInput = (schema, params = false, query = false) => {
	// console.log('here');

	return async (req, res, next) => {
		const { error } = await schema.validate(params ? req?.params : query ? req?.query : req?.body, { abortEarly: false });

		if (error) {
			const errors = await generateError(error?.details);
			return res.status(400).json({ message: 'Parameter validation error', error: errors, status: 400 });
		}

		next();
	};
};

module.exports = { validateUserInput };
