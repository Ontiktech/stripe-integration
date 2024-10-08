require("dotenv").config();

const express = require("express");

const { eventLogger } = require("./middlewares/logEvents");
const { errorHandler } = require("./middlewares/errorHandler");
const validateStripeWebhook = require("./middlewares/validateStripeWebhook");
const setupStripe = require("./middlewares/setupStripe.js");

const stripe = require("./utils/stripe.js");

const stripeController = require("./controllers/stripeController.js");
const userController = require("./controllers/userController.js");
const { seedAll } = require("./utils/db.js");
const { isTestEnvironment } = require("./utils/misc.js");

// routes files

const app = express();

seedAll(isTestEnvironment());

if (isTestEnvironment()) app.use(express.json());

if (stripe.isEnabled() && stripe.isWebhookEnabled()) {
	app.use(setupStripe);

	app.post(
		"/stripe/webhooks",
		express.raw({ type: "application/json" }),
		validateStripeWebhook,
		stripeController.webhooks
	);
	app.get("/stripe/success", stripeController.success);
}

if (!isTestEnvironment()) app.use(express.json());
app.use(eventLogger);

app.get("/", (req, res) => {
	res.send("Hello World!");
});
app.get("/users/:id", userController.getUser);
app.get("/users/:id/portal", userController.getPortal);
app.get("/users/:id/subscription", userController.getUserSubscription);
app.get("/users/:id/invoices", userController.getUserInvoices);

app.use(errorHandler);

module.exports = app;
