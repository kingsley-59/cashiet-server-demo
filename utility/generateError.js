const generateError = async details => {
	const obj = {};
	await details?.forEach(item => {
		obj[item?.path[0]] = item?.message?.replace(new RegExp('\\"', 'g'), '');
	});
	return obj;
};

module.exports = { generateError };
