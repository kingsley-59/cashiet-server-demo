const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const validateAddress = Joi.object().keys({
	// userId: Joi.objectId().required(),
    line1: Joi.string().required(),
    line2: Joi.string().optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.number().required(),
    country: Joi.string().required(),
    phoneNumber: Joi.number().required(),
    alternativePhoneNumber: Joi.number().required(),
	password: Joi.string()
		.min(8)
		.max(20)
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
		.required()
});

const validateNewPassword = Joi.object().keys({
	newPassword: Joi.string().min(3).required()
});

module.exports = { validateNewPassword, validateAddress, };
