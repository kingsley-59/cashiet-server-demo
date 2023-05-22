const cron = require('node-cron');
const htmlToText = require('html-to-text')
const order = require('../models/order');
const { sendEmail } = require('../mail/mailjet');
const remitaHelperFunction = require('../../utility/recurring-payment');
const { Payments } = require('./payment');

const runCronJob = async () => {
	// let job = cron.schedule(`${minutes} ${hour} ${date} * *`, async () => {

	let job = cron.schedule(`0 12 28 * *`, async () => {
		const now = new Date();
		const allOrders = await order.find().populate('user recurringCharges');

		const activeOrders = allOrders.filter(
			order => order.status === 'in-progress' && order.remainingAmount > 1 && order.recurringCharges && order.recurringCharges?.isActive
		);

		for (let order of activeOrders) {
			console.log(order)
			if (order.lastPaymentDate?.getMonth() !== now.getMonth()) {
				try {
					await Payments.debitUser(order)
				} catch (error) {
					order.failedTransactions = order.failedTransactions + 1
					await order.save()
				}
			}
		}
	});

	job.start();

	let reminder = cron.schedule(`0 12 23 * *`, async () => {
		const now = new Date();
		const allOrders = await order.find().populate('recurringPayment user');

		const activeOrders = allOrders.filter(
			order => order.status === 'pending' && order.remainingAmount > 0 && order.recurringPayment && order.recurringPayment?.isActive
		);

		activeOrders?.forEach(async order => {
			console.log(order);
			const messageToSend = `
		<!DOCTYPE html>
		<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
			<head>
				<meta charset="UTF-8" />
				<link href="./fonts/fonts.css" rel="stylesheet" />
				<meta http-equiv="X-UA-Compatible" content="IE=edge" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta name="x-apple-disable-message-reformatting" />
				<title>Document</title>
				<style>
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
		
					body {
						background-color: #ffffff;
						font-family: "Axiforma";
					}
				</style>
			</head>
			<body style="margin: 0; padding: 0">
				<table
					role="presentation"
					style="width: 100%; border-collapse: collapse; border: 0; border-spacing: 0; background: #ffffff; margin-top: 20px; margin-bottom: 20px"
				>
					<tr>
						<td align="center" style="padding: 0">
							<table
								role="presentation"
								style="min-width: 375px; border-collapse: collapse; border: 1px solid #cccccc; background-color: green; border-spacing: 0; text-align: left"
							>
								<tr>
									<td style="background: #fff; padding-top: 20px">
										<img
											src="https://res.cloudinary.com/djwa4cx9u/image/upload/v1655999355/cashiet_z3i27q.png"
											alt="Cashiet Logo"
											style="height: auto; display: block; width: 100%; max-width: 200px; margin: 10px auto"
										/>
									</td>
								</tr>
								<tr style="float: right; min-width: 344.8px">
									<td style="padding: 36px 30px 42px 30px; max-width: 329px; background-color: green">
										<table role="presentation" style="width: 100%; color: #fff; border-collapse: collapse; border: 0; border-spacing: 0">
											<tr>
												<td style="padding: 0 0 36px 0; color: #fff">
													<p style="font-size: 26.3px; margin: 0 0 29px 0; max-width: 232px; font-weight: 900; line-height: 36px">Verify Email Address</p>
													<p style="margin: 0 0 29px 0; font-size: 14.5px; line-height: 24px">Hi Joshua,</p>
													<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">
														Hello, Kindly use the link provided below to verify your email address.
													</p>
													<p style="margin: 0 0 29px 0; width: 243px; font-size: 14.5px; line-height: 25px">You can also copy and paste this link into your browser</p>
													<a href="https://www.cashiet.com">
														<button
															style="
																margin: 0 0 43px 0;
																font-family: 'Axiforma';
																width: 269px;
																height: 67px;
																border-radius: 52px;
																border: none;
																background-color: #fff;
																color: #fff000;
																font-size: 14.3px;
																line-height: 15px;
																font-weight: 600;
															"
														>
															Verify Email Address
														</button>
													</a>
													<p style="margin: 0 0 0px 0; width: 260px; font-size: 8.3px; font-weight: 400; line-height: 15px; color: #fff000">
														You are receiving this email because you have an outstanding order. This is a reminder that you will be automatically debited on the 28th of this month. <br />
														The sum of N${order.recurringPayment?.splitAmount} will be deducted from your account.
													</p>
													<Strong>Order Details </strong>
													<table>
													<thead>
														<tr><th>Product</th><th>Unit price(N)</th><th>Quantity</th></tr>
													</thead>
													<tbody>
														${order.orderItems?.forEach((item) => {
															return `<tr><td>${item.product}</td><td>${item.unitPrice}</td><td>${item.quantity}</td><tr>`
														})}
													</tbody>
													</table>
												</td>
											</tr>
										</table>
									</td>
								</tr>
								<tr></tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
		</html>
		
		`;
		sendEmail(order.deliveryAddress?.email, order.user?.username, 'Order payment reminder', htmlToText.convert(messageToSend), messageToSend);

		res.status(200).json({ message: 'Sent' });
		});
	})

	reminder.start()

	let checkDefaultTransaction = cron.schedule(`*/30 * * * *`, async () => {
		const now = new Date();
		const allOrders = await order.find().populate('recurringPayment');

		const defaultOrders = allOrders.filter(
			order =>
				order.status === 'pending' &&
				order.remainingAmount > 0 &&
				order.recurringPayment &&
				order.recurringPayment?.isActive &&
				order.failedTransactions > 0
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
