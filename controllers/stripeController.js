const { sendSuccessResponse } = require("../utils/response");
const { filter, update } = require("../utils/data");
const { logEvents } = require("../middlewares/logEvents");
const { format } = require("date-fns");
const { writeFile, readFile } = require("../utils/file");

const success = async (req, res, next) => {
	try {
		sendSuccessResponse(res, 200, "OK");
	} catch (error) {
		next(error);
	}
};

const webhooks = async (req, res, next) => {
	try {
		const event = req.webhookEvent;
		logEvents(`${event.type}\t${JSON.stringify(event.data)}`, `events_${format(new Date(), "yyyyMMdd")}.txt`);

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

	var usersJson = readFile("data", "users.json");
	var users = JSON.parse(usersJson);

	var user = filter(users, "stripe_customer_id", customerId, true);

	if (user) {
		user.stripe_subscription_id = subscriptionId;

		let updatedUsers = update(users, "id", user.id, user, true);
		let updatedUsersJson = JSON.stringify(updatedUsers);
		writeFile("data", "users.json", updatedUsersJson);
	}
};

const handleSubscriptionUpdated = async (data) => {};

const handleSubscriptionCancelled = async (data) => {
	const object = data.object;
	const subscriptionId = object.id;

	var usersJson = readFile("data", "users.json");
	var users = JSON.parse(usersJson);

	var user = filter(users, "stripe_subscription_id", subscriptionId, true);

	if (user) {
		user.stripe_subscription_id = null;

		let updatedUsers = update(users, "id", user.id, user, true);
		let updatedUsersJson = JSON.stringify(updatedUsers);
		writeFile("data", "users.json", updatedUsersJson);
	}
};

const handlePaymentMethodAttached = async (data) => {};

const handlePaymentMethodDetached = async (data) => {};

const handleInvoicePaid = async (data) => {};

module.exports = {
	success,
	webhooks,
};
