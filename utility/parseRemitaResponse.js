const parseResponse = (data, value) => {
	let num = !value ? 7 : value;
	const response = JSON.parse(data.slice(num, data.length - 1));
	return response;
};

module.exports = { parseResponse };
