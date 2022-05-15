const mongoose = require('mongoose');
const Subscriber = require('../models/subscriber');

const getAllSubscribers = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Subscriber.find()
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all subscribers', count: result.length, messages: result });
				} else {
					res.status(404).json({ message: 'No subscriber found', count: 0 });
				}
			})
			.catch(error => {
				res.status(500).json({ error });
			});
	} else res.status(401).json({ message: 'Unauthorized access' });
};

const subscribeToNewsletter = (req, res, next) => {
	Subscriber.find({ email: req.body.email })
		.exec()
		.then(person => {
			if (person.length < 1) {
				const newSubscriber = new Subscriber({
					_id: new mongoose.Types.ObjectId(),
					email: req.body.email
				});

				return newSubscriber
					.save()
					.then(() => {
						res.status(201).json({
							message: 'Successfully created new subscriber'
						});
					})
					.catch(error => res.status(500).json({ error }));
			} else {
				res.status(409).json({ message: 'Email already saved' });
			}
		});
};

const deleteSubscriber = (req, res, next) => {
	const id = req.params.subscriberId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'admin') {
		Subscriber.findById({ _id: id })
			.exec()
			.then(subscriber => {
				if (subscriber) {
					subscriber.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error });
						}
						res.status(200).json({ message: 'Subscriber successfully deleted' });
					});
				} else {
					res.status(500).json({ message: 'Subscriber does not exist' });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'An error occured: ' + error.message });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access' });
};

module.exports = {
	getAllSubscribers,
	subscribeToNewsletter,
	deleteSubscriber
};
