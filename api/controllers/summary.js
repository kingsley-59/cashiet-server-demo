const mongoose = require('mongoose')
const Product = require('../models/product')
const Order = require('../models/order')


const getProductStats = async (req, res) => {
    // const authenticatedUser = req.decoded.user

    try {
        const total_products = await Product.estimatedDocumentCount()
        const total_orders = await Order.estimatedDocumentCount()
        const total_cancelled_orders = await Order.find({status: 'cancelled'}).count()
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
        const total_items_sold = orderList.reduce(
            (prev, curr) => prev + curr?.quantity,
            0
        )
        res.status(200).json({
            total_products,
            total_orders,
            total_cancelled_orders,
            total_items_sold,
            data: orderList,
            message: 'Request sucessful!',
        })
    } catch (err) {
        console.log(err?.message)
        return res.status(500).json({message: err?.message ?? 'Error geting Product count'})
    }
}


module.exports = {
    getProductStats
}