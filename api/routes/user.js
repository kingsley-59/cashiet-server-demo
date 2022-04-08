const express = require("express");
const router = express.Router();

const verifyAuth = require("../middleware/verify-auth");
const { userSignup, getAllUsers, userLogin, getCurrentUser, getUserDetails, editUser, deleteUser, confirmEmail, resendEmailToken } = require("../controllers/user");

// get all users
router.get("/", verifyAuth, getAllUsers);

// create user account
router.post("/signup", userSignup);

// login user
router.post("/login", userLogin);

// confirm user email
router.get("/confirm/:emailToken", confirmEmail);

// resend email token
router.post("/resendEmailToken", resendEmailToken);

// get current user details
router.get("/user", verifyAuth, getCurrentUser);

// get specific user details
router.get("/:userId", verifyAuth, getUserDetails);

// edit user details
router.put("/:userId", verifyAuth, editUser);

// delete user details
router.delete("/:userId", verifyAuth, deleteUser);

module.exports = router;