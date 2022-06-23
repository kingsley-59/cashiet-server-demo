const Mailjet = require('node-mailjet');
const mailjet = Mailjet.apiConnect(process.env.MAILJET_PUBLIC_KEY, process.env.MAILJET_SECRET_KEY);

const sendEmail = (receiverEmail, receiverName, subject, textPart, htmlPart) => {
	const request = mailjet.post('send', { version: 'v3.1' }).request({
		Messages: [
			{
				From: {
					Email: 'enquiry@cashiet.com',
					Name: 'Cashiet'
				},
				To: [
					{
						Email: receiverEmail,
						Name: receiverName
					}
				],
				Subject: subject,
				TextPart: textPart,
				HTMLPart: htmlPart
				// CustomID: 'AppGettingStartedTest'
			}
		]
	});
	request
		.then(result => {
			// console.log(result.body);
			console.log('message sent');
		})
		.catch(err => {
			console.log(err.statusCode);
		});
};

module.exports = { sendEmail };
