const { sendErrorResponse, sendSuccessResponse } = require("../../utils/response");
const stripe = require("../../utils/stripe");
const moment = require("moment/moment");
const fs = require("fs");

const portal = async (req, res, next) => {
	try {
		if (!stripe.isEnabled()) {
			sendErrorResponse(res, 404, "Stripe is not enabled.");
			return;
		}

		if (!fs.existsSync("data/user_" + req.params.id + ".json")) {
			sendErrorResponse(res, 404, "User does not exist.");
			return;
		}

		var userJson = fs.readFileSync("data/user_" + req.params.id + ".json");
		var configJson = fs.readFileSync("data/config.json");
		var planJson = fs.readFileSync("data/plan.json");

		var user = JSON.parse(userJson);
		var config = JSON.parse(configJson);
		var plan = JSON.parse(planJson);

		var userUpdated = false;
		if (user.stripe_customer_id === null) {
			const stripeCustomer = await stripe.createCustomer(user);

			user.stripe_customer_id = stripeCustomer.id;
			userUpdated = true;
		}

		if (userUpdated) {
			userJson = JSON.stringify(user);
			fs.writeFile("data/user_" + req.params.id + ".json", userJson, (err) => {
				if (err) throw err;
			});
		}

		if (user.stripe_subscription_id !== null) {
			const stripeSession = await stripe.createBillingPortalSession(user, config);

			res.redirect(303, stripeSession.url);
			return;
		} else {
			const stripeCheckoutSession = await stripe.createCheckoutSession(user, plan);

			res.redirect(303, stripeCheckoutSession.url);
			return;
		}
	} catch (error) {
		next(error);
	}
};

const success = async (req, res, next) => {
	try {
		res.sendFile(__basedir + "/public/payment-success.html");
	} catch (error) {
		next(error);
	}
};

const webhook = async (req, res, next) => {
	try {
		const event = req.webhookEvent;

		switch (event.type) {
			case "customer.subscription.created":
				await handleSubscriptionCreated(event.data);
				break;

			case "customer.subscription.updated":
				await handleSubscriptionUpdated(event.data);
				break;

			case "customer.subscription.deleted":
				await handleSubscriptionCancelled(event.data);
				break;

			case "payment_method.attached":
				await handlePaymentMethodAttached(event.data);
				break;

			case "payment_method.detached":
				await handlePaymentMethodDetached(event.data);
				break;

			case "invoice.paid":
				await handleInvoicePaid(event.data);
				break;
		}

		return sendSuccessResponse(res, 200, "OK");
	} catch (error) {
		next(error);
	}
};

const handleSubscriptionCreated = async (data) => {
	const object = data.object;
	const subscriptionId = object.id;
	const customerId = object.customer;

	const user = await prisma.users.findFirst({
		where: {
			stripe_customer_id: customerId,
		},
	});

	if (user) {
		let expiresAt = moment.unix(object.current_period_end).toISOString();

		await prisma.subscriptions.create({
			data: {
				status: object.status,
				user_id: user.id,
				package_id: 1,
				method: "stripe",
				stripe_subscription_id: subscriptionId,
				expires_at: expiresAt,
			},
		});

		if (object.metadata.referral_code_id) {
			await prisma.user_referrels.create({
				user_id: user.id,
				referral_code_id: object.metadata.referral_code_id,
			});
		}

		const package = await prisma.packages.findFirst({
			where: {
				id: 1,
			},
		});

		const notification = await prisma.notifications.create({
			data: {
				user_id: user.id,
				title: "Subscribed",
				subtitle: "Subscribed to the package " + package.name + " successfully.",
			},
		});

		await createNotification(notification);

		await generateMealForUser(user.id);
	}
};

const handleSubscriptionUpdated = async (data) => {
	const object = data.object;
	const previousData = data.previous_attributes;
	const subscriptionId = object.id;

	let expiresAt = moment.unix(object.current_period_end).toISOString();

	const subscription = await prisma.subscriptions.findFirst({
		where: {
			stripe_subscription_id: subscriptionId,
		},
	});

	if (subscription) {
		await prisma.subscriptions.update({
			where: {
				id: subscription.id,
			},
			data: {
				status: object.status,
				expires_at: expiresAt,
			},
		});

		if (previousData.cancel_at_period_end === false) {
			const notification = await prisma.notifications.create({
				data: {
					user_id: subscription.user_id,
					title: "Auto-renewal Cancelled",
					subtitle: "Auto-renewal process cancelled successfully.",
				},
			});

			await createNotification(notification);
		} else if (previousData.cancel_at_period_end === true) {
			const notification = await prisma.notifications.create({
				data: {
					user_id: subscription.user_id,
					title: "Auto-renewal Enabled",
					subtitle: "Auto-renewal process enabled successfully.",
				},
			});

			await createNotification(notification);
		}
	}
};

const handleSubscriptionCancelled = async (data) => {
	const object = data.object;
	const subscriptionId = object.id;
	const expiredAt = moment.unix(object.ended_at).toISOString();

	const subscription = await prisma.subscriptions.findFirst({
		where: {
			stripe_subscription_id: subscriptionId,
		},
	});

	if (subscription) {
		await prisma.subscriptions.update({
			where: {
				id: subscription.id,
			},
			data: {
				status: object.status,
				expires_at: expiredAt,
			},
		});
		const package = await prisma.packages.findFirst({
			where: {
				id: 1,
			},
		});

		const notification = await prisma.notifications.create({
			data: {
				user_id: subscription.user_id,
				title: "Unsubscribed",
				subtitle: "Unsubscribed from the package " + package.name + " successfully.",
			},
		});

		await createNotification(notification);
	}
};

const handlePaymentMethodAttached = async (data) => {
	const object = data.object;
	const customerId = object.customer;

	const user = await prisma.users.findFirst({
		where: {
			stripe_customer_id: customerId,
		},
	});

	if (user) {
		const notification = await prisma.notifications.create({
			data: {
				user_id: user.id,
				title: "Billing Information Updated",
				subtitle: "Added a new payment method.",
			},
		});

		await createNotification(notification);
	}
};

const handlePaymentMethodDetached = async (data) => {
	const object = data.object;
	const customerId = object.customer;

	const user = await prisma.users.findFirst({
		where: {
			stripe_customer_id: customerId,
		},
	});

	if (user) {
		const notification = await prisma.notifications.create({
			data: {
				user_id: user.id,
				title: "Billing Information Updated",
				subtitle: "Deleted a payment method.",
			},
		});

		await createNotification(notification);
	}
};

const handleInvoicePaid = async (data) => {
	const object = data.object;
	const customerId = object.customer;
	const subscriptionId = object.subscription;

	const user = await prisma.users.findFirst({
		where: {
			stripe_customer_id: customerId,
		},
	});

	if (user) {
		await prisma.invoices.create({
			data: {
				amount_paid: object.amount_paid / 100.0,
				hosted_url: object.hosted_invoice_url,
				pdf_url: object.invoice_pdf,
				paid_at: moment(object.status_transitions.paid_at * 1000).toISOString(),
				user_id: user.id,
				stripe_subscription_id: subscriptionId,
				stripe_invoice_id: object.id,
			},
		});
	}
};

module.exports = {
	portal,
	success,
	webhook,
};
