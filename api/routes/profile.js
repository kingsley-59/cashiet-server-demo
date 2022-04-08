const express = require('express');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');
const {
	getAllUsersProfile,
	addProfileDetails,
	getCurrentUserProfile,
	editUserProfile,
	deleteUserProfile,
	getUserProfileDetails,
	updateProfileImage
} = require('../controllers/profile');
const { upload } = require('../middleware/multer');

// get all users profile
router.get('/', verifyAuth, getAllUsersProfile);

// add mew user profile
router.post('/', verifyAuth, upload.single('profileImage'), addProfileDetails);

// get current user profile
router.get('/user-profile', verifyAuth, getCurrentUserProfile);

// get specific user details - id can either be userId or profileId
router.get('/:id', verifyAuth, getUserProfileDetails);

// edit user details - id can either be userId or profileId
router.put('/', verifyAuth, editUserProfile);

// edit profile image
router.put('/profile-picture', verifyAuth, updateProfileImage);

// delete user details
router.delete('/:userId', verifyAuth, deleteUserProfile);

module.exports = router;
