const mongoose = require('mongoose');
const { addMonths } = require('../../utility/addMonths');
const Order = require('../models/order');
const PaymentDetails = require('../models/payment-details');
const RecurringCharges = require('../models/recurring-charges');
const { getAuthorizationToken, chargeAuthorization } = require('../service/paystack');

// ["save_and_buy_later", "pay_later", "buy_now"]

class Payments {
    constructor(req, res, authenticatedUser, orderId) {
        this.req = req
        this.res = res
        this.authenticatedUser = authenticatedUser;
        this.orderId = orderId
        this.order = {}
        this.paymentOption = ''
    }

    async getOrderDetails() {
        const order = await Order.findOne({
            _id: this.orderId,
            user: this.authenticatedUser._id
        }).populate('user recurringCharges paymentOption').exec()
        if (!order) return this.res.status(404).json({ message: 'Order with current user not found.' })
        this.paymentOption = order.paymentOption.type;
        this.order = order

        return { order, paymentOption: order.paymentOption.type }
    }

    async processPayLaterOrder(duration, splitAmount) {
        console.log('getting payment details...')
        // get payment details
        const details = await PaymentDetails.findOne({ user: this.authenticatedUser._id }).exec()
        if (!details) return this.res.status(404).json({ message: 'Card not found! Please add card to proceed with payment.' })

        console.log('creating recurring charge...')
        // create new recurring charge
        const charge = new RecurringCharges({
            _id: mongoose.Types.ObjectId(),
            startDate: new Date(),
            endDate: addMonths(new Date(), duration),
            duration, splitAmount,
            isActive: true,
            paymentDetails: details._id
        })
        await charge.save()

        console.log('charging card...')
        // charge the authorization code from payment details
        const { data } = await chargeAuthorization(details.customer.email, splitAmount, details.authorization.authorization_code)
        if (data?.data?.status !== 'success') return this.res.status(400).json({ message: 'Initial debit was not successful. Pls check the card and try again.' })

        console.log('Updating order')
        // update order with the created recurring charge
        this.order.recurringCharges = charge._id
        await this.order.save()

        console.log('Done.')
        this.res.status(200).json({ message: 'A recurring payment started successfully, to be renewed monthly.' })
    }

    async processSaveAndBuyLaterOrder(duration, splitAmount) {

    }
}



const verifyTestTransaction = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const reference = req.params.reference

    try {
        const { authorization, customer } = await getAuthorizationToken(reference)
        if (authorization.reusable !== true) return res.status(400).json({ message: 'Card is not reusable. Please try a different card.' })

        // check if card already exists. 
        const prevCardDetails = await PaymentDetails.findOne({ user: authenticatedUser._id }).exec()
        if (!prevCardDetails) {
            const details = new PaymentDetails({
                user: authenticatedUser._id,
                authorization, customer
            })
            await details.save()

            return res.status(200).json({ message: 'Verification successful.', authorization, customer })
        }

        // update existing card
        prevCardDetails.authorization = authorization
        prevCardDetails.customer = customer
        await prevCardDetails.save()
        res.status(200).json({ message: 'Verification successful.', authorization, customer })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getUserPaymentDetails = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;

    if (role === 'superadmin' || role === 'admin') return res.status(401).json({ message: 'Unauthorized! Only users can see their payment details.' })

    try {
        const detail = await PaymentDetails.findOne({ user: authenticatedUser._id }).populate('user').exec();
        if (!detail) return res.status(404).json({ message: 'Payment details not found.' });

        res.status(200).json({ message: 'Request successful.', data: detail })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const processPayment = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;
    const { orderId, duration, splitAmount } = req.body;

    if (role === 'superadmin' || role === 'admin') return res.status(401).json({ message: 'Only users can process payments on their orders.' })

    try {
        console.log('processing payment...')
        const payment = new Payments(req, res, authenticatedUser, orderId)
        const { paymentOption } = await payment.getOrderDetails()

        switch (paymentOption) {
            case 'pay_later':
                await payment.processPayLaterOrder(duration, splitAmount)
                break;
            case 'save_and_buy_later':
                await payment.processSaveAndBuyLaterOrder(duration, splitAmount)
                break;

            default:
                res.status(200).json({ message: 'Buy now is a client feature.' })
                break;
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

const dumpPaymentDetailsTable = async (req, res, next) => {
    try {
        const details = await PaymentDetails.find({}).populate({ path: 'user' }).exec()

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