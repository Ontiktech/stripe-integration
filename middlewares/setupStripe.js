const { readFile, writeFile } = require("../utils/file");

const {
	createWebhookEndpoints,
	deleteOldWebhookEndpoints,
	createBillingPortalConfiguration,
	createProduct,
	createPrice,
	updateProduct,
	updatePrice,
	retrievePrice,
} = require("../utils/stripe");

const setupStripe = async (req, res, next) => {
	try {
		let configJson = readFile("data", "config.json");
		var planJson = readFile("data", "plan.json");

		let config = JSON.parse(configJson);
		var plan = JSON.parse(planJson);

		let stripeUpdated = false;
		if (config.webhook_endpoints_secret === null) {
			await deleteOldWebhookEndpoints();
			const stripeWebhookEndpoint = await createWebhookEndpoints();

			config.webhook_endpoints_secret = stripeWebhookEndpoint.secret;
			stripeUpdated = true;
		}

		if (config.portal_configuration_id === null) {
			const stripePortalConfiguration = await createBillingPortalConfiguration();

			config.portal_configuration_id = stripePortalConfiguration.id;
			stripeUpdated = true;
		}

		if (stripeUpdated) {
			let updatedConfigJson = JSON.stringify(config);
			writeFile("data", "config.json", updatedConfigJson);
		}

		let planUpdated = false;
		if (plan.stripe_product_id === null) {
			const stripeProduct = await createProduct(plan);

			plan.stripe_product_id = stripeProduct.id;
			planUpdated = true;
		} else {
			await updateProduct(plan);
		}

		if (plan.stripe_price_id !== null) {
			const oldStripePrice = await retrievePrice(plan.stripe_price_id);

			if (
				oldStripePrice.currency !== plan.currency.toLowerCase() ||
				oldStripePrice.unit_amount / 100 !== plan.price ||
				oldStripePrice.recurring.interval_count !== plan.duration ||
				oldStripePrice.product !== plan.stripe_product_id
			) {
				await updatePrice(plan.stripe_price_id, {
					active: false,
				});
			}
		}

		const stripePrice = await createPrice(plan);

		plan.stripe_price_id = stripePrice.id;
		planUpdated = true;

		if (planUpdated) {
			let updatedPlanJson = JSON.stringify(plan);
			writeFile("data", "plan.json", updatedPlanJson);
		}

		next();
	} catch (error) {
		next(error);
	}
};

module.exports = setupStripe;
