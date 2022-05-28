const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const Token = require('../models/token');
const { sendEmail } = require('../mail');
const Support = require('../models/support');

const sendMessage = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	try {
		const message = new Support({
			_id: new mongoose.Types.ObjectId(),
			fullName: req.body.fullName,
			message: req.body.message,
			user: authenticatedUser._id
		});

		return message
			.save()
			.then(() => {
				res.status(201).json({ message: 'Message sent successfully' });
			})
			.catch(error => {
				return res.status(500).json({ error });
			});
	} catch (error) {
		return res.status(500).json({ error, message: 'Check your details and try again' });
	}
};

const getAllMessages = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Support.find()
			.populate('user')
			.exec()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all messages', total: result.length, messages: result });
				} else {
					res.status(404).json({ message: 'No message found' });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

const getCurrentUserMessages = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	Support.findOne({ user: authenticatedUser._id })
		.populate('user')
		.exec()
		.then(messages => {
			res.status(200).json({ messages, total: messages.length });
		})
		.catch(error => {
			res.status(500).json({ error, message: 'No valid entry found' });
		});
};

const deleteMessage = (req, res, next) => {
	const id = req.params.messageId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Support.findById({ _id: id })
			.exec()
			.then(message => {
				if (message) {
					message.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Message successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Message does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	sendMessage,
	getAllMessages,
	getCurrentUserMessages,
	deleteMessage
};
