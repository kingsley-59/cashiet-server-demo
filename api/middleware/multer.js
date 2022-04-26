const multer = require('multer');

// const upload = multer({ dest: 'uploads/', limits: 1024 * 1024 });

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		// cb(null, __dirname + '/uploads');
		cb(null, 'public/uploads');
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + file.originalname.replace(/\s+/g, '-'));
	}
});

const fileFilter = (req, file, cb) => {
	// reject a file
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const upload = multer({
	storage,
	limits: {
		fileSize: 1024 * 1024 // 1mb max
	},
	fileFilter: fileFilter
});

module.exports = { upload };
