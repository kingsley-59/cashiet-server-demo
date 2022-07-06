const mongoose = require('mongoose');
const Subscriber = require('../models/subscriber');

const getAllSubscribers = (req, res, next) => {
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Subscriber.find()
			.select('email')
			.then(result => {
				if (result.length > 0) {
					res.status(200).json({ message: 'Successfully fetched all subscribers', total: result.length, subscribers: result, status: 200 });
				} else {
					res.status(404).json({ message: 'No subscriber found', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'Unable to fetch subscribers', status: 500 });
			});
	} else res.status(401).json({ message: 'Unauthorized access', status: 401 });
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
							message: 'Successfully created new subscriber',
							status: 201
						});
					})
					.catch(error => res.status(500).json({ error, message: 'Unable to save subscriber email', status: 500 }));
			} else {
				res.status(409).json({ message: 'Email already saved', status: 409 });
			}
		});
};

const deleteSubscriber = (req, res, next) => {
	const id = req.params.subscriberId;
	const authenticatedUser = req.decoded.user;

	if (authenticatedUser.role === 'superadmin' || authenticatedUser.role === 'admin') {
		Subscriber.findById({ _id: id })
			.exec()
			.then(subscriber => {
				if (subscriber) {
					subscriber.deleteOne((error, success) => {
						if (error) {
							return res.status(500).json({ error, message: 'Unable to delete subscriber', status: 500 });
						}
						res.status(200).json({ message: 'Subscriber successfully deleted', status: 200 });
					});
				} else {
					res.status(404).json({ message: 'Subscriber does not exist', status: 404 });
				}
			})
			.catch(error => {
				res.status(500).json({ error, message: 'Subscriber not found', status: 500 });
			});
	} else return res.status(401).json({ error, message: 'Unauthorized access', status: 401 });
};

module.exports = {
	getAllSubscribers,
	subscribeToNewsletter,
	deleteSubscriber
};
