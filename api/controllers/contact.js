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
			.then(newMessage => {
				return res.status(201).json({
					message: 'Message sent successfully'
				});
			})
			.catch(error => {
				return res.status(500).json({ error });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Check your details and try again' });
	}
};

const getAllMessages = (req, res, next) => {
	Contact.find()
		.exec()
		.then(result => {
			if (result.length > 0) {
				res.status(200).json({ message: 'Successfully fetched all messages', total: result.length, contacts: result });
			} else {
				res.status(404).json({ message: 'No users found' });
			}
		})
		.catch(error => {
			res.status(500).json({ error });
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
						return res.status(500).json({ error });
					}
					res.status(200).json({ message: 'Message successfully deleted' });
				});
			} else {
				res.status(500).json({ message: 'User does not exist' });
			}
		})
		.catch(error => {
			res.status(500).json({ error, message: 'An error occured: ' + error.message });
		});
};

module.exports = {
	sendMessage,
	getAllMessages,
	deleteMessage
};
