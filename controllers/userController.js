const { filter } = require("../utils/data");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const stripe = require("../utils/stripe");
const fs = require("fs");

const getUser = async (req, res, next) => {
	try {
		var usersJson = fs.readFileSync("data/users.json");
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

const getUserSubscription = async (req, res, next) => {
	try {
		var usersJson = fs.readFileSync("data/users.json");
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
		var usersJson = fs.readFileSync("data/users.json");
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
	getUserSubscription,
	getUserInvoices,
};
