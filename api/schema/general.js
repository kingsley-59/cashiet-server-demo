const Joi = require('joi');

const validateEmail = Joi.object().keys({
	email: Joi.string().trim().email().required()
});

module.exports = { validateEmail };
