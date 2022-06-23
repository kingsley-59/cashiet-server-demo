const cron = require('node-cron');
const order = require('../models/order');
const remitaHelperFunction = require('../../utility/recurring-payment');

const runCronJob = async () => {
	// let job = cron.schedule(`${minutes} ${hour} ${date} * *`, async () => {

	let job = cron.schedule(`0 12 28 * *`, async () => {
		const now = new Date();
		const allOrders = await order.find().populate('recurringPayment');

		const activeOrders = allOrders.filter(order => order.status === 'pending' && order.remainingAmount > 0 && order.recurringPayment);

		activeOrders?.forEach(async order => {
			console.log(order);
			if (order.lastPaymentDate?.getMonth() !== now.getMonth()) {
				await remitaHelperFunction.debitUser(
					order._id,
					order.recurringPayment.splitAmount,
					order.recurringPayment.mandateId,
					order.recurringPayment.payerAccountNumber,
					order.recurringPayment.payerBankCode
				);
			}
		});
	});

	job.start();

	let checkDefaultTransaction = cron.schedule(`*/30 * * * *`, async () => {
		const now = new Date();
		const allOrders = await order.find().populate('recurringPayment');

		const defaultOrders = allOrders.filter(
			order => order.status === 'pending' && order.remainingAmount > 0 && order.recurringPayment && order.failedTransactions > 0
		);

		defaultOrders?.forEach(async order => {
			console.log(order);
			if (order.lastPaymentDate?.getMonth() !== now.getMonth()) {
				await remitaHelperFunction.debitUser(
					order._id,
					order.recurringPayment.splitAmount,
					order.recurringPayment.mandateId,
					order.recurringPayment.payerAccountNumber,
					order.recurringPayment.payerBankCode,
					false
				);
			}
		});
	});

	checkDefaultTransaction.start();
};

module.exports = runCronJob;
