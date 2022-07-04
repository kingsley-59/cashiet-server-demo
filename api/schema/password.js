const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const validateResetPassword = Joi.object().keys({
	userId: Joi.objectId().required(),
    token: Joi.string().required(),
	password: Joi.string()
		.min(8)
		.max(20)
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
		.required()
});

const validateNewPassword = Joi.object().keys({
	newPassword: Joi.string().min(3).required()
});

module.exports = { validateNewPassword, validateResetPassword, };
