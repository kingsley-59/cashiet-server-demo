const fs = require('fs');

const fileToBase64 = file => {
	const data = fs.readFileSync(file);
	return data.toString('base64');
};

module.exports = { fileToBase64 };
