const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// const multer = require("multer");
require('dotenv').config();

const subscriberRoute = require('./api/routes/subscriber');
const contactRoute = require('./api/routes/contact');
const userRoute = require('./api/routes/user');
const categoryRoute = require('./api/routes/category');
const productRoute = require('./api/routes/product');
const addressRoute = require('./api/routes/address');

mongoose.connect(`mongodb+srv://cashiet:${process.env.MONGODB_PASSWORD}@cluster0.gesp0.mongodb.net/cashietDatabase?retryWrites=true&w=majority`);

var corsOptions = {
	origin: '*',
	allowedHeaders: '*',
	methods: 'GET, POST, OPTIONS, PUT, PATCH, DELETE'
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors(corsOptions));

app.use('/api/v1/subscribers', subscriberRoute);
app.use('/api/v1/contact', contactRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/products', productRoute);
app.use('/api/v1/address', addressRoute);

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
