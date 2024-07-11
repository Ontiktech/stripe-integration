require("dotenv").config();

const express = require("express");

const { eventLogger } = require("./middlewares/logEvents");
const { errorHandler } = require("./middlewares/errorHandler");
const validateStripeWebhook = require("./middlewares/validateStripeWebhook.js");

const stripe = require("./utils/stripe.js");

const stripeController = require("./controllers/payment/stripeController.js");

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

app.get("/portal/:id", stripeController.portal);
app.get("/success", stripeController.success);

app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, console.log(`Server is listening on port: ${port}`));
