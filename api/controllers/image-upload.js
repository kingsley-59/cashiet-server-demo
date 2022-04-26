const fs = require('fs');
const util = require('util');

const unlinkFile = util.promisify(fs.unlink);

const { uploadFile, getFileStream } = require('../middleware/s3');

const getImage = (req, res) => {
	const key = req.params.key;
	const readStream = getFileStream(key);
	readStream.pipe(res);
};

// post image to server
const uploadImage = async (req, res, next) => {
	const file = req.file;

	if (!req.file) {
		res.status(500).json({ message: 'Please, select a file to upload' });
	}

	// upload file to s3 bucket
	const result = await uploadFile(file);
	// console.log(result);

	if (result) {
		// delete file from local storage folder (upload)
		await unlinkFile(file.path);
		// console.log(result);
		// return the result
		res.status(201).json({ imagePath: `/images/${result.Key}` });
	} else {
		res.status(500).json({ message: 'Unable to upload image to the server' });
	}
};

module.exports = {
	getImage,
	uploadImage
};
