const { sendErrorResponse } = require("../utils/response");
const stripe = require("../utils/stripe");
const { readFile } = require("../utils/file");
const { isTestEnvironment } = require("../utils/misc");

const validateStripeWebhook = async (req, res, next) => {
	try {
		if (stripe.isEnabled()) {
			var stripeConfigurationJson = readFile("data", "config.json");
			var stripeConfiguration = JSON.parse(stripeConfigurationJson);
			if (!stripeConfiguration.webhook_endpoints_secret === null) throw Error();

			const sig = req.headers["stripe-signature"];
			try {
				req.webhookEvent = stripe.constructEvent(req, sig, stripeConfiguration.webhook_endpoints_secret);
			} catch (error) {
				if (isTestEnvironment() && sig !== "test-signature") {
					sendErrorResponse(res, 403, "Access Denied.", error);
					return;
				}

				req.webhookEvent = req.body.event;
			}
		}

		next();
	} catch (error) {
		next(error);
	}
};

module.exports = validateStripeWebhook;
