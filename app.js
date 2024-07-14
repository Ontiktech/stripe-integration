require("dotenv").config();

const express = require("express");

const { eventLogger } = require("./middlewares/logEvents");
const { errorHandler } = require("./middlewares/errorHandler");
const validateStripeWebhook = require("./middlewares/validateStripeWebhook");

const stripe = require("./utils/stripe.js");

const stripeController = require("./controllers/stripeController.js");
const userController = require("./controllers/userController.js");

// routes files

const app = express();

if (stripe.isEnabled() && stripe.isWebhookEnabled()) {
	stripe.setup();
	app.post(
		"/stripe/webhooks",
		express.raw({ type: "application/json" }),
		validateStripeWebhook,
		stripeController.webhook
	);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(eventLogger);
global.__basedir = __dirname;

app.get("/portal/:id", stripeController.getPortal);
app.get("/success", stripeController.success);

app.get("/users/:id", userController.getUser);
app.get("/users/:id/subscription", userController.getUserSubscription);
app.get("/users/:id/invoices", userController.getUserInvoices);

app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, console.log(`Server is listening on port: ${port}`));
