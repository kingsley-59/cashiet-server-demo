const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const addProfile = Joi.object().keys({
	firstName: Joi.string().min(2).required(),
	lastName: Joi.string().min(2).required(),
	middleName: Joi.string().min(2).optional(),
	gender: Joi.string().valid('male', 'female').required(),
	profileImage: Joi.any().optional(),
	dob: Joi.date().optional(),
	phoneNumber: Joi.number().required(),
	address: Joi.string().optional(),
	nationality: Joi.string().optional()
});

const validateProfileId = Joi.object().keys({
	profileId: Joi.objectId().required()
});

const validateId = Joi.object().keys({
	id: Joi.objectId()
});

module.exports = { addProfile, validateProfileId, validateId };
