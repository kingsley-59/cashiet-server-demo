const express = require('express');
const router = express.Router();

const verifyAuth = require('../middleware/verify-auth');
const {
	userSignup,
	getAllUsers,
	userLogin,
	getCurrentUser,
	getUserDetails,
	editUser,
	deleteUser,
	confirmEmail,
	resendEmailToken,
	createAdmin,
	testEmail,
	adminLogin,
	getAllAdmin
} = require('../controllers/user');
const { paginatedResults } = require('../middleware/pagination');
const user = require('../models/user');
const userSchema = require('../schema/user');
const { validateUserInput } = require('../middleware/validateFields');

// get all users
router.get('/', verifyAuth, paginatedResults(user, '', 'username email role isVerified modeOfRegistration'), getAllUsers);

// create user account
router.post('/signup', validateUserInput(userSchema.validateSignup), userSignup);

// create admin account
router.post('/admin/signup', validateUserInput(userSchema.validateSignup), verifyAuth, createAdmin);

// login user
router.post('/login', validateUserInput(userSchema.validateLogin), userLogin);

// admin login
router.post('/admin/login', validateUserInput(userSchema.validateLogin), adminLogin);

// confirm user email
router.get('/confirm/:emailToken', confirmEmail);

// resend email token
router.post('/resendEmailToken', validateUserInput(userSchema.validateEmail), resendEmailToken);

// get current user details
router.get('/user', verifyAuth, getCurrentUser);

// get all admin details
router.get('/admin', verifyAuth, getAllAdmin);

// get specific user details
router.get('/:userId', verifyAuth, getUserDetails);

// edit user details
router.put('/:userId', verifyAuth, editUser);

// delete user details
router.delete('/:userId', verifyAuth, deleteUser);

router.post('/testemail/me', testEmail);

// logout user
router.get('/logout', verifyAuth, userLogin);

module.exports = router;
