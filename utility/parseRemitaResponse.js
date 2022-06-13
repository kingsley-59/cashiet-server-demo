const parseResponse = data => {
	const response = JSON.parse(data.slice(7, data.length - 1));
	return response;
};

module.exports = { parseResponse };
