const mongoose = require('mongoose');

const OrderSchema = mongoose.Schema(
	{
		_id: mongoose.Schema.Types.ObjectId,

		orderDate: {
			type: Date,
			required: [true, 'Specify the order date']
		},

		status: {
			type: String,
			enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], // enum means string objects
			default: 'pending'
		},

		orderItems: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Product',
					required: true
				},

				quantity: {
					type: Number,
					default: 1
				},

				unitPrice: {
					type: Number,
					required: true
				},

				discount: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Discount'
				}
			}
		],

		deliveryAddress: {
			line1: {
				type: String,
				required: [true, 'You must provide your primary address'],
				minLength: [7, 'Enter address in full']
			},

			line2: {
				type: String,
				minLength: [7, 'Enter address in full']
			},

			city: {
				type: String,
				required: [true, 'You must provide your city'],
				minLength: [2, 'City Name must have at least 2 characters']
			},

			state: {
				type: String,
				required: [true, 'You must provide your state'],
				minLength: [2, 'State Name must have at least 2 characters']
			},

			zip: {
				type: String,
				required: [true, 'You must provide your zip'],
				minLength: [2, 'Zip Name must have at least 2 characters']
			},

			country: {
				type: String,
				required: [true, 'You must provide your country'],
				minLength: [2, 'Country Name must have at least 2 characters']
			},

			phoneNumber: {
				type: Number,
				required: [true, 'You must provide your valid phone number'],
				minLength: [11, 'Phone Number Name must have at least 2 characters']
			},

			alternativePhoneNumber: {
				type: Number
			},

			email: {
				type: String,
				match: [
					/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					'Enter a valid email address'
				]
			},

			alternativeEmail: {
				type: String,
				match: [
					/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
					'Enter a valid email address'
				]
			}
		},

		shippingFee: {
			type: Number,
			default: 0
		},

		deliveryDate: {
			type: Date,
			default: null
		},

		deliveryStatus: {
			type: String,
			enum: ['pending', 'in-transit', 'delivered'],
			default: 'pending'
		},

		paymentOption: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'PaymentOptions',
			required: true
		},

		paymentStatus: {
			type: String,
			enum: ['unpaid', 'part_payment', 'paid'],
			default: 'unpaid'
		},

		totalAmount: {
			type: Number,
			default: 0
		},

		remainingAmount: {
			type: Number,
			default: 0
		},

		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},

		saveAndBuy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'SaveAndBuyLater'
		}
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
