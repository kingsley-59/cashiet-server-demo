const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config();

const subscriberRoute = require('./api/routes/subscriber');
const contactRoute = require('./api/routes/contact');
const userRoute = require('./api/routes/user');
const categoryRoute = require('./api/routes/category');
const productRoute = require('./api/routes/product');
const addressRoute = require('./api/routes/address');
const profileRoute = require('./api/routes/profile');
const idCardRoute = require('./api/routes/id-card');
const discountRoute = require('./api/routes/discount');
const inventoryRoute = require('./api/routes/product-inventory');
const productGalleryRoute = require('./api/routes/product-gallery');
const orderItemsRoute = require('./api/routes/order-items');
const orderRoute = require('./api/routes/order');
const paymentOptionRoute = require('./api/routes/payment');
const invoiceRoute = require('./api/routes/invoice');
const transactionRoute = require('./api/routes/transaction');
const supportRoute = require('./api/routes/support');
const passwordRoute = require('./api/routes/password');

// mongoose.connect(`mongodb+srv://cashiet:${process.env.MONGODB_PASSWORD}@cluster0.gesp0.mongodb.net/cashietDatabase?retryWrites=true&w=majority`);
mongoose.connect(`mongodb+srv://cashiet:${process.env.MONGODB_PASSWORD}@cluster0.m3xsd3p.mongodb.net/?retryWrites=true&w=majority`);

var corsOptions = {
	origin: '*',
	allowedHeaders: '*',
	methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(corsOptions));

app.use(express.static(path.resolve('./public')));

app.use('/api/v1/subscribers', subscriberRoute);
app.use('/api/v1/contact', contactRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/products', productRoute);
app.use('/api/v1/address', addressRoute);
app.use('/api/v1/profile', profileRoute);
app.use('/api/v1/id-card', idCardRoute);
app.use('/api/v1/discount', discountRoute);
app.use('/api/v1/inventory', inventoryRoute);
app.use('/api/v1/product-gallery', productGalleryRoute);
app.use('/api/v1/order-items', orderItemsRoute); 
app.use('/api/v1/order', orderRoute); 
app.use('/api/v1/payment-option', paymentOptionRoute);
app.use('/api/v1/invoice', invoiceRoute);
app.use('/api/v1/transactions', transactionRoute);
app.use('/api/v1/support', supportRoute);
app.use('/api/v1/password', passwordRoute);

app.use('/check', (req, res, next) => {
	res.json({
		message: 'Server is running',
		status: 200
	});
});

app.use((req, res, next) => {
	const error = new Error('Not Found...');
	error.status = 404;
	next(error);
});

app.use((error, req, res, next) => {
	res.json({
		error: {
			message: error.message
		}
	});
});

module.exports = app;
