const { sendErrorResponse, sendSuccessResponse } = require("../utils/response");
const stripe = require("../utils/stripe");
const fs = require("fs");
const { logToFile } = require("../utils/logger");
const { filter, update } = require("../utils/data");

const getPortal = async (req, res, next) => {
	try {
		if (!stripe.isEnabled()) {
			sendErrorResponse(res, 404, "Stripe is not enabled.");
			return;
		}

		var usersJson = fs.readFileSync("data/users.json");
		var configJson = fs.readFileSync("data/config.json");
		var planJson = fs.readFileSync("data/plan.json");

		var users = JSON.parse(usersJson);
		var config = JSON.parse(configJson);
		var plan = JSON.parse(planJson);

		var user = filter(users, "id", parseInt(req.params.id), true);
		if (user === null) {
			sendErrorResponse(res, 404, "User does not exist.");
			return;
		}

		var userUpdated = false;
		if (user.stripe_customer_id === null) {
			const stripeCustomer = await stripe.createCustomer(user);

			user.stripe_customer_id = stripeCustomer.id;
			userUpdated = true;
		}

		if (userUpdated) {
			let updatedUsers = update(users, "id", user.id, user, true);
			let updatedUsersJson = JSON.stringify(updatedUsers);
			fs.writeFile("data/users.json", updatedUsersJson, (err) => {
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
		logToFile("events", event);

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

	var usersJson = fs.readFileSync("data/users.json");
	var users = JSON.parse(usersJson);

	var user = filter(users, "stripe_customer_id", customerId, true);

	if (user) {
		user.stripe_subscription_id = subscriptionId;

		let updatedUsers = update(users, "id", user.id, user, true);
		let updatedUsersJson = JSON.stringify(updatedUsers);
		fs.writeFile("data/users.json", updatedUsersJson, (err) => {
			if (err) throw err;
		});
	}
};

const handleSubscriptionUpdated = async (data) => {};

const handleSubscriptionCancelled = async (data) => {
	const object = data.object;
	const subscriptionId = object.id;

	var usersJson = fs.readFileSync("data/users.json");
	var users = JSON.parse(usersJson);

	var user = filter(users, "stripe_subscription_id", subscriptionId, true);

	if (user) {
		user.stripe_subscription_id = null;

		let updatedUsers = update(users, "id", user.id, user, true);
		let updatedUsersJson = JSON.stringify(updatedUsers);
		fs.writeFile("data/users.json", updatedUsersJson, (err) => {
			if (err) throw err;
		});
	}
};

const handlePaymentMethodAttached = async (data) => {};

const handlePaymentMethodDetached = async (data) => {};

const handleInvoicePaid = async (data) => {};

module.exports = {
	getPortal,
	success,
	webhook,
};
