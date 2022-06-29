// const Joi = require('joi');

const validateUserInput = async (body, schema, res, next) => {
	const response = await schema.validate(body, { abortEarly: false });
	return response;
};

module.exports = { validateUserInput };
