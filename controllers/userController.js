const { filter, update } = require("../utils/data");
const { readFile, writeFile } = require("../utils/file");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const stripe = require("../utils/stripe");

const getUser = async (req, res, next) => {
	try {
		var usersJson = readFile("data", "users.json");
		var users = JSON.parse(usersJson);

		var user = filter(users, "id", parseInt(req.params.id), true);

		if (user === null) {
			sendErrorResponse(res, 404, "User does not exist.");
			return;
		}

		sendSuccessResponse(res, 200, "OK", user);
	} catch (error) {
		next(error);
	}
};

const getPortal = async (req, res, next) => {
	try {
		if (!stripe.isEnabled()) {
			sendErrorResponse(res, 404, "Stripe is not enabled.");
			return;
		}

		var usersJson = readFile("data", "users.json");
		var configJson = readFile("data", "config.json");
		var planJson = readFile("data", "plan.json");

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
			writeFile("data", "users.json", updatedUsersJson);
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

const getUserSubscription = async (req, res, next) => {
	try {
		var usersJson = readFile("data", "users.json");
		var users = JSON.parse(usersJson);

		var user = filter(users, "id", parseInt(req.params.id), true);

		if (user === null) {
			sendErrorResponse(res, 404, "User does not exist.");
			return;
		}

		if (user.stripe_subscription_id === null) {
			sendErrorResponse(res, 404, "User is not subscribed.");
			return;
		}

		var stripeSubscription = await stripe.retrieveSubscription(user.stripe_subscription_id);

		sendSuccessResponse(res, 200, "OK", stripeSubscription);
	} catch (error) {
		next(error);
	}
};

const getUserInvoices = async (req, res, next) => {
	try {
		var usersJson = readFile("data", "users.json");
		var users = JSON.parse(usersJson);

		var user = filter(users, "id", parseInt(req.params.id), true);

		if (user === null) {
			sendErrorResponse(res, 404, "User does not exist.");
			return;
		}

		if (user.stripe_customer_id === null) {
			sendSuccessResponse(res, 200, "OK", { object: "list", data: [], has_more: false, url: "/v1/invoices" });
			return;
		}

		var stripeInvoices = await stripe.listInvoices(null, null, null, user.stripe_customer_id);

		sendSuccessResponse(res, 200, "OK", stripeInvoices);
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getUser,
	getPortal,
	getUserSubscription,
	getUserInvoices,
};
