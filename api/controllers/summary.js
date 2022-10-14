const mongoose = require('mongoose')
const Product = require('../models/product')
const Order = require('../models/order')
const RecurringPayments = require('../models/recurring-payment')
const Transactions = require('../models/transaction')
const Wishlist = require('../models/wishlist')


const adminDashboardSummary = async (req, res) => {
    const authenticatedUser = req.decoded.user

    if (authenticatedUser.role !== 'admin' && authenticatedUser.role !== 'superadmin') {
        console.log((authenticatedUser.role !== 'admin' || authenticatedUser.role !== 'superadmin'))
		return res.status(403).json({ message: 'You are not authorized to perform this action' });
    }

    try {
        // transaction model stats
        const totalTransactions = await Transactions.estimatedDocumentCount()
        
        // product model stats
        const totalProducts = await Product.estimatedDocumentCount()
        const products = await Product.find({}).exec()
        const totalAmountInStock = products.reduce(
            (prev, curr) => prev + (curr.price * curr.quantity) ,
            0
        )
        const totalAmountSold = products.reduce(
            (prev, curr) => prev + (curr.price * curr.quantitySold) , 
            0
        )
        
        // order model stats
        const totalOrders = await Order.estimatedDocumentCount()
        const totalCancelledOrders = await Order.find({status: 'cancelled'}).count()
        const paidOrders = await Order.find({staus: 'paid'})
            .select('orderItems')
            .populate({ path: 'orderItems', populate: { path: 'product', model: 'Product', select: 'name' } }).exec()
        const compileOrders = () => {
            let orders = paidOrders.map(order => order.orderItems)
            let totalOrders = []
            orders.forEach(order => {
                totalOrders = [...totalOrders, ...order]
            });
            return totalOrders
        }
        const orderList = compileOrders()
        const totalItemsSold = orderList.reduce(
            (prev, curr) => prev + curr?.quantity,
            0
        )
        res.status(200).json({
            totalProducts,
            totalTransactions,
            totalAmountInStock,
            totalAmountSold,
            totalOrders,
            totalCancelledOrders,
            totalItemsSold,
            // orders: orderList,
            message: 'Request sucessful!',
        })
    } catch (err) {
        console.log(err?.message)
        return res.status(500).json({message: err?.message ?? 'Error geting summary'})
    }
}


const userDashboardSummary = async (req, res) => {
    const authenticatedUser = req.decoded.user

    try {
        const orders = await Order.find({user: authenticatedUser._id}).exec()
        const pendingOrders = orders.filter(order => order.status === 'pending')
        const wishlist = await Wishlist.find({user: authenticatedUser._id}).exec()

        res.status(200).json({
            orders: {
                total: orders?.length ?? 0,
                totalPendingOrders: pendingOrders.length,
                pendingOrders,
                all: orders
            },
            wishlist: {
                total: wishlist?.length ?? 0,
                all: wishlist
            }
        })
    } catch (error) {
        console.log(err?.message)
        return res.status(500).json({message: err?.message ?? 'Error geting summary'})
    }
}


module.exports = {
    adminDashboardSummary,
    userDashboardSummary,
}