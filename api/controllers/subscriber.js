const mongoose = require('mongoose');
const Subscriber = require('../models/subscriber');

const getAllSubscribers = (req, res, next) => {
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

module.exports = {
	getAllSubscribers,
	subscribeToNewsletter
};
