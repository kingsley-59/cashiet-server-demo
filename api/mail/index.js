const sgMail = require('@sendgrid/mail');

const API_KEY = process.env.SEND_GRID_API_KEY;

sgMail.setApiKey(API_KEY);

const sendEmail = (receiver, subject, messageToSend) => {
	const message = {
		to: receiver, // where I am sending it to
		// to: [receiver, "receiver2@yahoo.com"], // to send to multiple people
		from: {
			name: 'Cashiet',
			email: 'oyelekeoluwasayo@gmail.com'
		}, // verified email with sendgrid
		subject: subject,
		html: messageToSend
	};

	sgMail.send(message).catch(err => console.log(err.message));
};

module.exports = { sendEmail };
