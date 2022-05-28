const API_KEY = process.env.MAILGUN_PUBLIC_KEY;
const USERNAME = process.env.MAILGUN_USERNAME;

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: USERNAME, key: API_KEY });

const sendEmail = (receiver, subject, messageToSend) => {
	const messageParams = {
		from: 'Cashiet <cashieltltd@gmail.com>',
		to: receiver,
		subject: subject,
		text: messageToSend,
		html: messageToSend
	};

	mg.messages
		.create(process.env.MAILGUN_SANDBOX, messageParams)
		.then(msg => console.log('Message sent to user', msg)) // logs response data
		.catch(err => console.log('Error', err)); // logs any error
};

module.exports = { sendEmail };

// const sgMail = require('@sendgrid/mail');

// const API_KEY = process.env.SEND_GRID_API_KEY;

// sgMail.setApiKey(API_KEY);

// const sendEmail = (receiver, subject, messageToSend) => {
// 	const message = {
// 		to: receiver, // where I am sending it to
// 		// to: [receiver, "receiver2@yahoo.com"], // to send to multiple people
// 		from: {
// 			name: 'Cashiet',
// 			email: 'oyelekeoluwasayo@gmail.com'
// 		}, // verified email with sendgrid
// 		subject: subject,
// 		html: messageToSend
// 	};

// 	sgMail.send(message).catch(err => console.log(err.message));
// };
