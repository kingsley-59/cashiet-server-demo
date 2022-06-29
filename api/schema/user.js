const Joi = require('joi');

const validateSignup = Joi.object().keys({
	email: Joi.string().trim().email().required(),
	username: Joi.string().min(3).required(),
	password: Joi.string()
		.min(8)
		.max(20)
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
		.required()
});

const validateLogin = Joi.object().keys({
	email: Joi.string().trim().email().required(),
	password: Joi.string().min(3).required()
});

const validateEmail = Joi.object().keys({
	email: Joi.string().trim().email().required()
});

module.exports = { validateLogin, validateSignup, validateEmail };
