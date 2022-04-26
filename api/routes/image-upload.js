const express = require('express');
const { getImage, uploadImage } = require('../controllers/image-upload');
const router = express.Router();
const { upload } = require('../middleware/multer');

const verifyAuth = require('../middleware/verify-auth');

// get an image
router.get('/:key', getImage);

// upload an image
router.post('/', verifyAuth, upload.single('image'), uploadImage);

module.exports = router;
