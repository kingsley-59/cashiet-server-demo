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
const { validateUserInput } = require('../middleware/validateFields');
const profileSchema = require('../schema/profile');

// get all users profile
router.get('/', verifyAuth, getAllUsersProfile);

// add new user profile
router.post('/', verifyAuth, validateUserInput(profileSchema.addProfile), upload.single('profileImage'), addProfileDetails);

// get current user profile
router.get('/user', verifyAuth, getCurrentUserProfile);

// get specific user details - id can either be userId or profileId
router.get('/:profileId', verifyAuth, validateUserInput(profileSchema.validateProfileId, (params = true)), getUserProfileDetails);

// edit user details - id can either be userId or profileId
router.put('/', verifyAuth, editUserProfile);

// edit profile image
router.put('/profile-picture', verifyAuth, upload.single('profileImage'), updateProfileImage);

// delete user details (id can be userId or profileId)
router.delete('/:id', verifyAuth, validateUserInput(profileSchema.validateId, (params = true)), deleteUserProfile);

module.exports = router;
