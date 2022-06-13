const buyLaterFunction = require('../../utility/buyLater');

const setupMandate = async (req, res) => {
	await buyLaterFunction.setupMandate(req, res);
};

const activateMandateOtp = async (req, res) => {
	await buyLaterFunction.activateOtp(req, res);
};

const validateMandateOtp = async (req, res) => {
	await buyLaterFunction.validateOtp(req, res);
};

const fillMandateForm = async (req, res) => {
	await buyLaterFunction.fillMandateForm(req, res);
};

module.exports = { setupMandate, activateMandateOtp, validateMandateOtp, fillMandateForm };
