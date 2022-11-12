const mongoose = require('mongoose');
const Order = require('../models/order');
const PaymentDetails = require('../models/payment-details');
const RecurringCharges = require('../models/recurring-charges');
const { getAuthorizationToken, chargeAuthorization } = require('../service/paystack');

// ["save_and_buy_later", "pay_later", "buy_now"]

const processPayLaterOrder = (initialAmount, order) => {}

const processSaveAndBuyLaterOrder = () => {}


const verifyTestTransaction = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const reference = req.params.reference

    try {
        const { authorization, customer } = await getAuthorizationToken(reference)
        if (authorization.reusable !== true) return res.status(400).json({message: 'Card is not reusable. Please try a different card.'})

        const details = new PaymentDetails({
            user: authenticatedUser._id,
            authorization, customer
        })
        await details.save()

        res.status(200).json({ message: 'Verification successful.', authorization, customer })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getUserPaymentDetails = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;

    if (role === 'superadmin' || role === 'admin') return res.status(401).json({message: 'Unauthorized! Only users can see their payment details.'})

    try {
        const detail = await PaymentDetails.findOne({user: authenticatedUser._id}).populate('user').exec();
        if (!detail) return res.status(404).json({message: 'Payment details not found.'});

        res.status(200).json({message: 'Request successful.', data: detail})
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const processPayment = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;
    const { orderId, startDate, endDate, duration, splitAmount  } = req.params.orderId;

    if (role === 'superadmin' || role === 'admin') return res.status(401).json({message: 'Only users can process payments on their orders.'})

    try {
        const order = await Order.findOne({ 
            _id: orderId, 
            user: authenticatedUser._id 
        }).populate('user recurringCharges paymentOption').exec()
        if (!order) return res.status(404).json({message: 'Order with current user not found.'})
        const totalAmount = order.totalAmount;
        const paymentOption = order.paymentOption.type;

        if (paymentOption === 'pay_later') {
            // process pay later order
            const details = await PaymentDetails.findOne({ user: authenticatedUser._id }).exec()
            if (!details) return res.status(404).json({message: 'Card not found! Please add card to proceed with payment.'})

            const charge = new RecurringCharges({
                startDate: new Date(),
                endDate: new Date(),
                duration, splitAmount,
                isActive: true,
                paymentDetails: details._id
            })
            await charge.save()

            const { data } = await chargeAuthorization(details.customer.email, splitAmount, details.authorization.authorization_code)
            if (data?.data?.status !== 'success') return res.status(400).json({message: 'Initial debit was not successful. Pls check the card and try again.'})

            order.recurringCharges = charge._id
            await order.save()

        } else if (paymentOption === 'save_and_buy_later') {
            // process save and buy later order

        } else {
            // process buy now

        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const dumpPaymentDetailsTable = async (req, res, next) => {
    try {
        const details = await PaymentDetails.find({}).populate({path: 'user'}).exec()

        res.status(200).json({ mmessage: 'Data retrieved successfully.', data: details })
    } catch (error) {
        res.status(500).json({ message: error?.message ?? 'Failed to retrieve all payment details' })
    }
}


module.exports = {
    verifyTestTransaction,
    getUserPaymentDetails,
    processPayment,
    dumpPaymentDetailsTable
}