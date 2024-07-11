const fs = require("fs");

const { sendErrorResponse } = require("../utils/response");
const stripe = require("../utils/stripe");

const validateStripeWebhook = async (req, res, next) => {
	try {
		if (stripe.isEnabled()) {
			var stripeConfigurationJson = fs.readFileSync("data/config.json");
			var stripeConfiguration = JSON.parse(stripeConfigurationJson);
			if (!stripeConfiguration.webhook_endpoints_secret === null) throw Error();

			try {
				const sig = req.headers["stripe-signature"];
				req.webhookEvent = stripe.constructEvent(req, sig, settings);
			} catch (error) {
				console.log(error);
				sendErrorResponse(res, 403, "Access Denied.", error);
				return;
			}
		}

		next();
	} catch (error) {
		next(error);
	}
};

module.exports = validateStripeWebhook;
