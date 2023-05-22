const mongoose = require('mongoose');
const { addMonths } = require('../../utility/addMonths');
const Invoice = require('../models/invoice');
const Order = require('../models/order');
const PaymentDetails = require('../models/payment-details');
const RecurringCharges = require('../models/recurring-charges');
const Transactions = require('../models/transactions');
const User = require('../models/user');
const { getAuthorizationToken, chargeAuthorization, refundPayment } = require('../service/paystack');

// ["save_and_buy_later", "pay_later", "buy_now"]

class Payments {
    constructor(req, res, authenticatedUser, orderId, cardId) {
        this.req = req
        this.res = res
        this.authenticatedUser = authenticatedUser;
        this.cardId = cardId
        this.card = {}
        this.orderId = orderId
        this.order = {}
        this.paymentOption = ''
        this.invoice = {}
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

    async getCardDetails() {
        const card = await PaymentDetails.findOne({ _id: this.cardId }).exec()
        if (!card) return this.res.status(404).json({ message: 'Card not found! Please add card again.' })
        this.card = card

        return this.card
    }

    async processRecurringPayment() {
        console.log('getting payment & invoice details...')
        // get invoice details
        const invoice = await Invoice.findOne({ order: this.orderId }).populate('recurringCharges').exec()
        const recurringCharge = invoice.recurringCharges
        this.invoice = invoice

        try {
            console.log('charging card...')
            // charge the authorization code from payment details
            let amount = recurringCharge.splitAmount * 100
            const { data } = await chargeAuthorization(this.card.customer.email, amount, this.card.authorization.authorization_code)
            console.log({ chargeResponse: data })
            if (data?.data?.status !== 'success') return this.res.status(400).json({ message: `${data?.data?.gateway_response}. Initial debit was not successful. Pls check the card and try again!` })

            await this.saveTransaction({
                order: this.orderId,
                invoice: this.invoice._id,
                user: this.authenticatedUser._id,
                response: data?.data,
                reference: data?.reference,
            })
        } catch (error) {
            console.log({ chargeError: error })
            return this.handlePaymentsError(error)
        }


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

    handlePaymentsError(error) {
        if (error?.response?.status?.startsWith('4')) {
            this.saveTransaction({
                order: this.orderId,
                invoice: this.invoice._id,
                user: this.authenticatedUser._id,
                success: false
            }).then(() => {
                return this.res.status(400).json({ message: 'Failed to complete transaction.', error: error?.response?.data ?? {} })
            }).catch((error) => {
                return this.res.status(500).json({ message: 'Something went wrong!', error })
            })
        }

        return this.res.status(500).json({ message: error.message ?? 'Something went wrong!', error })
    }

    async saveTransaction({ order, invoice, user, reference = '', response = {}, isRecurring = true, success = true }) {
        const newTransaction = new Transactions({
            invoice, order, user, success, isRecurring, response, reference
        })
        await newTransaction.save()
    }

    async processPayLaterOrder() {
        this.processRecurringPayment()
    }

    async processSaveAndBuyLaterOrder() {
        this.processRecurringPayment()
    }

    static async debitUser(order, amount = '', authorization = '') {
        console.log('getting payment details...')

        // get payment details
        const userId = order.user._id
        const recurringChargesId = order?.recurringCharges ? order?.recurringCharges?._id : ''
        const details = await PaymentDetails.findOne({ user: userId }).exec()
        if (!details) {
            order.failedTransactions = order.failedTransactions + 1
            await order.save()
            return;
        }

        console.log('charging card...')
        // charge the authorization code from payment details
        const debitAmount = amount ?? (order.remainingAmount > order.recurringCharges?.splitAmount ? order.recurringCharges?.splitAmount : order.remainingAmount)
        const authorization_code = authorization ?? details.authorization.authorization_code
        const { data } = await chargeAuthorization(details.customer.email, debitAmount, authorization_code)
        if (data?.data?.status !== 'success') {
            order.failedTransactions = order.failedTransactions + 1
            await order.save()
            return;
        }

        console.log('Updating order...')
        // update order with the created recurring charge
        let remainingAmount = Number(order.remainingAmount) - Number(debitAmount)
        order.remainingAmount = remainingAmount
        order.status = (remainingAmount > 1) ? 'in-progress' : 'paid'
        order.paymentStatus = (remainingAmount > 1) ? 'part_payment' : 'paid'
        order.lastPaymentDate = new Date()
        await order.save()

        console.log('updating recurring charges...')
        //update recurring charges
        if (recurringChargesId) {
            const charges = await RecurringCharges.findOne({ _id: recurringChargesId }).exec()
            charges.isActive = (remainingAmount > 1) ? true : false
            await charges.save()
        }

        console.log('Done.')
        return;
    }
}



const verifyTestTransaction = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const reference = req.params.reference

    try {
        const { authorization, customer, data } = await getAuthorizationToken(reference)
        console.log({ verifyRes: data })
        if (authorization.reusable !== true) return res.status(400).json({ message: 'Card is not reusable. Please try a different card.' })

        // add new card details. 
        const details = new PaymentDetails({
            user: authenticatedUser._id,
            authorization,
            customer,
            reference
        })
        await details.save()

        // get all card details and return
        const cards = await PaymentDetails.find({ user: authenticatedUser._id })
        refundPayment(reference, data?.amount).then(refundData => {
            console.log({ refundData })
            res.status(200).json({ message: 'Verification successful. Refund is processing.', data: cards, refundData })
            details.isRefunded = true
            details.save().then(() => { })
        }).catch(error => {
            console.log({ refundError: error })
            res.status(200).json({ message: 'Verification successful. Please contact admin for refund.', data: cards, error: error?.response?.data?.message ?? error.message })
        })
    } catch (error) {
        console.log(error)
        res.status(error?.status ?? 500).json({ message: error?.response?.data?.message ?? error.message, error: error })
    }
}

const refundAddCardCharges = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;
    const reference = req.params.reference

    if (role !== 'superadmin' && role !== 'admin') return res.status(400).json({ message: 'Only admins can intiate a manual refund' })
    if (!reference) return res.status(400).json({ message: 'Reference is required.' })

    try {
        const details = await PaymentDetails.findOne({ reference: reference }).exec()
        if (!details) return res.status(404).json({ message: 'Card with reference not found.' })

        const refundData = await refundPayment(reference)
        details.isRefunded = true
        await details.save()
        res.status(200).json({ message: 'Refund initiated successfully.', data: refundData })
    } catch (error) {
        console.log(error)
        res.status(error?.status ?? 500).json({ message: error?.response?.data?.message ?? error.message, error: error })
    }
}

const getUserPaymentDetails = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;

    if (role === 'superadmin' || role === 'admin') return res.status(401).json({ message: 'Unauthorized! Only users can see their payment details.' })

    try {
        const detail = await PaymentDetails.find({ user: authenticatedUser._id }).exec();
        if (detail.length === 0) return res.status(404).json({ message: 'Payment details not found.' });

        res.status(200).json({ message: 'Request successful.', data: detail })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const adminGetUserPaymentDetails = async (req, res, next) => {
    const authenticatedUser = req.decoded.user
    const role = authenticatedUser.role
    const { userId } = req.params

    if (role !== 'superadmin' && role !== 'admin') return res.status(400).json({ message: 'Only admins have access to this resource' })

    try {
        const detail = await PaymentDetails.find({ user: userId }).exec();
        if (detail.length === 0) return res.status(404).json({ message: 'Payment details not found.' });

        res.status(200).json({ message: 'Request successful.', data: detail })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

const getAllPaymentDetails = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;

    if (role !== 'superadmin' && role !== 'admin') return res.status(403).json({ message: 'Unauthorized!' })

    try {
        const details = await PaymentDetails.find({}).populate({ path: 'user' }).exec()

        res.status(200).json({ mmessage: 'Data retrieved successfully.', total: details.length, data: res.paginatedResults })
    } catch (error) {
        res.status(500).json({ message: error?.message ?? 'Failed to retrieve all payment details' })
    }
}

const processPayment = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;
    const { orderId, cardId } = req.body;

    if (role === 'superadmin' || role === 'admin') return res.status(401).json({ message: 'Only users can process payments on their orders.' })

    try {
        console.log('processing payment...')
        const payment = new Payments(req, res, authenticatedUser, orderId, cardId)
        const { paymentOption } = await payment.getOrderDetails()
        await payment.getCardDetails()

        switch (paymentOption) {
            case 'pay_later':
                await payment.processPayLaterOrder()
                break;
            case 'save_and_buy_later':
                await payment.processSaveAndBuyLaterOrder()
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

const manualDebit = async (req, res) => {
    const authenticatedUser = req.decoded.user;
    const role = authenticatedUser.role;
    const { userId } = req.params
    const { cardId, orderId, amount } = req.body

    if (role !== 'superadmin' && role !== 'admin') return res.status(400).json({ message: 'Only admins have access to this action' })

    try {
        const user = await User.findOne({ _id: userId }).exec()
        if (!user) return res.status(404).json({ message: 'User not found!' })

        console.log('processing manual debit...')
        const payment = new Payments(req, res, user, orderId, cardId)
        const { paymentOption, order } = await payment.getOrderDetails()
        const card = await payment.getCardDetails()

        await Payments.debitUser(order, amount, card.authorization.authorization_code)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error?.response?.data?.message ?? error.message, stack: error?.stack })
    }
}

const removeCard = async (req, res, next) => {
    const authenticatedUser = req.decoded.user;
    const cardId = req.params.cardId

    try {
        const deletedCard = await PaymentDetails.findOneAndDelete({ _id: cardId }).exec()
        return res.status(200).json({ message: 'Card deleted succesfully!', data: deletedCard })
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
    adminGetUserPaymentDetails,
    getAllPaymentDetails,
    processPayment,
    manualDebit,
    removeCard,
    refundAddCardCharges,
    dumpPaymentDetailsTable
}