const express = require('express');
const { addProduct, getAllProducts, deleteProduct, editProduct } = require('../controllers/product');
const router = express.Router();
const { upload } = require('../middleware/multer');

// console.log(upload);

const verifyAuth = require('../middleware/verify-auth');

// get all products
router.get('/', getAllProducts);

// create new product
router.post('/', verifyAuth, upload.single('image'), addProduct);

// // login user
// router.post("/login", userLogin);

// // confirm user email
// router.get("/confirm/:emailToken", confirmEmail);

// // resend email token
// router.post("/resendEmailToken", resendEmailToken);

// // get current user details
// router.get("/user", verifyAuth, getCurrentUser);

// // get specific user details
// router.get("/:userId", verifyAuth, getUserDetails);

// edit product details
router.put('/:productId', verifyAuth, editProduct);

// delete user details
router.delete('/:productId', verifyAuth, deleteProduct);

module.exports = router;
