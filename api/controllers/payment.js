const mongoose = require('mongoose');
const { addMonths } = require('../../utility/addMonths');
const Invoice = require('../models/invoice');
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
        console.log('getting payment & invoice details...')
        // get payment and invoice details
        const details = await PaymentDetails.findOne({ user: this.authenticatedUser._id }).exec()
        if (!details) return this.res.status(404).json({ message: 'Card not found! Please add card to proceed with payment.' })
        const invoice = await Invoice.findOne({order: this.orderId}).populate('recurringCharges').exec()
        const recurringCharge = invoice.recurringCharges

        console.log('charging card...')
        // charge the authorization code from payment details
        const { data } = await chargeAuthorization(details.customer.email, recurringCharge.splitAmount, details.authorization.authorization_code)
        if (data?.data?.status !== 'success') return this.res.status(400).json({ message: 'Initial debit was not successful. Pls check the card and try again.' })

        console.log('Updating order')
        // update order with the created recurring charge
        let remainingAmount = Number(this.order.totalAmount) - Number(recurringCharge.splitAmount)
        this.order.recurringCharges = recurringCharge._id
        this.order.remainingAmount = remainingAmount
        this.order.status = (remainingAmount > 1) ? 'in-progress' : 'paid'
        this.order.paymentStatus = (remainingAmount > 1) ? 'part_payment' : 'paid'
        this.order.lastPaymentDate = new Date()
        await this.order.save()

        console.log('Done.')
        this.res.status(200).json({ message: 'A recurring payment started successfully, to be renewed monthly.' })
    }

    async processSaveAndBuyLaterOrder(duration, splitAmount) {
        console.log('getting payment & invoice details...')
        // get payment and invoice details
        const details = await PaymentDetails.findOne({ user: this.authenticatedUser._id }).exec()
        if (!details) return this.res.status(404).json({ message: 'Card not found! Please add card to proceed with payment.' })
        const invoice = await Invoice.findOne({order: this.orderId}).populate('recurringCharges').exec()
        const recurringCharge = invoice.recurringCharges

        console.log('charging card...')
        // charge the authorization code from payment details
        const { data } = await chargeAuthorization(details.customer.email, recurringCharge.splitAmount, details.authorization.authorization_code)
        if (data?.data?.status !== 'success') return this.res.status(400).json({ message: 'Initial debit was not successful. Pls check the card and try again.' })

        console.log('Updating order')
        // update order with the created recurring charge
        let remainingAmount = Number(this.order.totalAmount) - Number(recurringCharge.splitAmount)
        this.order.recurringCharges = recurringCharge._id
        this.order.remainingAmount = remainingAmount
        this.order.status = (remainingAmount > 1) ? 'in-progress' : 'paid'
        this.order.paymentStatus = (remainingAmount > 1) ? 'part_payment' : 'paid'
        this.order.lastPaymentDate = new Date()
        await this.order.save()

        console.log('Done.')
        this.res.status(200).json({ message: 'A recurring payment started successfully, to be renewed monthly.' })
    }

    static async debitUser(order) {
        console.log('getting payment details...')
        // get payment details
        const userId = order.user
        const recurringChargesId = order.recurringCharges._id
        const details = await PaymentDetails.findOne({ user: userId }).exec()
        if (!details) {
            order.failedTransactions = order.failedTransactions + 1
            await order.save()
            return ;
        }

        console.log('charging card...')
        // charge the authorization code from payment details
        const { data } = await chargeAuthorization(details.customer.email, order.recurringCharges.splitAmount, details.authorization.authorization_code)
        if (data?.data?.status !== 'success') {
            order.failedTransactions = order.failedTransactions + 1
            await order.save()
            return ;
        }

        console.log('Updating order...')
        // update order with the created recurring charge
        let remainingAmount = Number(order.totalAmount) - Number(splitAmount)
        order.remainingAmount = remainingAmount
        order.status = (remainingAmount > 1) ? 'in-progress' : 'paid'
        order.paymentStatus = (remainingAmount > 1) ? 'part_payment' : 'paid'
        order.lastPaymentDate = new Date()
        await order.save()

        console.log('updating recurring charges...')
        //update recurring charges
        const charges = await RecurringCharges.findOne({_id: recurringChargesId}).exec()
        charges.isActive = (remainingAmount > 1) ? true : false
        await charges.save()

        console.log('Done.')
        return;
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
    Payments,
    verifyTestTransaction,
    getUserPaymentDetails,
    processPayment,
    dumpPaymentDetailsTable
}