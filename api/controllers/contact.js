const mongoose = require('mongoose');
const Contact = require('../models/contact');

const sendMessage = (req, res, next) => {
	try {
		const message = new Contact({
			_id: new mongoose.Types.ObjectId(),
			email: req.body.email.toLowerCase(),
			firstName: req.body.firstName.toLowerCase(),
			lastName: req.body.lastName.toLowerCase(),
			phoneNumber: req.body.phoneNumber,
			message: req.body.message
		});

		return message
			.save()
			.then(() => {
				return res.status(201).json({
					status: 201,
					message: 'Message sent successfully'
				});
			})
			.catch(error => {
				return res.status(500).json({ error, message: 'Unable to send message', status: 500 });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Invalid details', status: 500 });
	}
};

const getAllMessages = (req, res, next) => {
	Contact.find()
		.select('firstName lastName email phoneNumber message')
		.exec()
		.then(result => {
			if (result.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all messages', total: result.length, contacts: result, status: 200 });
			} else {
				res.status(200).json({ message: 'No users found', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Unable to send message', status: 500 });
		});
};

const deleteMessage = (req, res, next) => {
	const id = req.params.messageId;

	Contact.findById({ _id: id })
		.exec()
		.then(message => {
			if (message) {
				message.remove((error, success) => {
					if (error) {
						return res.status(500).json({ error, message: 'unable to delete message', status: 500 });
					}
					res.status(200).json({ message: 'Message successfully deleted', status: 200 });
				});
			} else {
				res.status(200).json({ message: 'User does not exist', status: 200 });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'Message with that id not found', status: 500 });
		});
};

module.exports = {
	sendMessage,
	getAllMessages,
	deleteMessage
};
