const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const validateCategoryId = Joi.object().keys({
	categoryId: Joi.string().trim().required()
});

const validateProductId = Joi.object().keys({
	productId: Joi.objectId().required()
});

const filterProduct = Joi.object().keys({
	page: Joi.number().min(1),
	limit: Joi.number().min(5)
});

const addProduct = Joi.object().keys({
	name: Joi.string().required(),
	price: Joi.number().required(),
	keywords: Joi.array().required(),
	description: Joi.string().required(),
	category: Joi.string().required(),
	// image: Joi.any().required(),
	productLength: Joi.number().optional(),
	productWidth: Joi.number().optional(),
	productHeight: Joi.number().optional()
});

module.exports = { validateCategoryId, validateProductId, filterProduct, addProduct };
