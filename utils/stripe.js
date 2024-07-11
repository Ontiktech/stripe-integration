const stripe = require("stripe");
const { getURL } = require("./misc");
const moment = require("moment/moment");
const fs = require("fs");

const client = process.env.STRIPE_API_KEY ? stripe(process.env.STRIPE_API_KEY) : false;

const isEnabled = () => Boolean(client);

const isWebhookEnabled = () => process.env.STRIPE_WEBHOOK_ENABLED === "true";

const getClient = () => client;

const setup = async () => {
	let configJson = fs.readFileSync("data/config.json");
	var planJson = fs.readFileSync("data/plan.json");

	let config = JSON.parse(configJson);
	var plan = JSON.parse(planJson);

	let stripeUpdated = false;
	if (config.webhook_endpoints_secret === null) {
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
		configJson = JSON.stringify(config);
		fs.writeFile("data/config.json", configJson, (err) => {
			if (err) throw err;
		});
	}

	let planUpdated = false;
	if (plan.stripe_product_id === null) {
		const stripeProduct = await createProduct(plan);

		plan.stripe_product_id = stripeProduct.id;
		planUpdated = true;
	} else {
		await updateProduct(plan);
	}

	if (plan.stripe_price_id === null) {
		const stripePrice = await createPrice(plan);

		plan.stripe_price_id = stripePrice.id;
		planUpdated = true;
	} else {
		const stripePrice = await client.prices.retrieve(plan.stripe_price_id);
		if (
			stripePrice.currency !== plan.currency.toLowerCase() ||
			stripePrice.unit_amount / 100 !== plan.price ||
			stripePrice.recurring.interval_count !== plan.duration ||
			stripePrice.product !== plan.stripe_product_id
		) {
			await updatePrice(plan.stripe_price_id, {
				active: false,
			});
			const stripePrice = await createPrice(plan);

			plan.stripe_price_id = stripePrice.id;
			planUpdated = true;
		}
	}

	if (planUpdated) {
		planJson = JSON.stringify(plan);
		fs.writeFile("data/plan.json", planJson, (err) => {
			if (err) throw err;
		});
	}

	console.log("Stripe setup successful.");
};

const createProduct = async (plan) => {
	return await client.products.create({
		name: plan.name,
		description: plan.description,
	});
};

const updateProduct = async (plan) => {
	return await client.products.update(plan.stripe_product_id, {
		name: plan.name,
		description: plan.description,
	});
};

const createPrice = async (plan) => {
	return await client.prices.create({
		currency: plan.currency,
		unit_amount: plan.price * 100,
		recurring: {
			interval: "day",
			interval_count: plan.duration,
		},
		product: plan.stripe_product_id,
	});
};

const updatePrice = async (price_id, params) => {
	return await client.prices.update(price_id, params);
};

const createWebhookEndpoints = async () => {
	return await client.webhookEndpoints.create({
		enabled_events: [
			"customer.subscription.created",
			"customer.subscription.updated",
			"customer.subscription.deleted",
			"payment_method.attached",
			"payment_method.detached",
			"invoice.paid",
		],
		url: getURL("/stripe/webhooks"),
	});
};

const createBillingPortalConfiguration = async () => {
	return await client.billingPortal.configurations.create({
		business_profile: {
			headline: "Lorem ipsum dolor sit amet",
		},
		features: {
			invoice_history: {
				enabled: true,
			},
			customer_update: {
				enabled: false,
			},
			payment_method_update: {
				enabled: true,
			},
			subscription_cancel: {
				enabled: true,
			},
		},
	});
};

const createCustomer = async (user) => {
	return await client.customers.create({
		email: user.email,
		name: user.first_name + " " + user.last_name,
	});
};

const createBillingPortalSession = async (user, config) => {
	return await client.billingPortal.sessions.create({
		customer: user.stripe_customer_id,
		configuration: config.portal_configuration_id,
	});
};

const createCheckoutSession = async (user, plan) => {
	return await client.checkout.sessions.create({
		customer: user.stripe_customer_id,
		success_url: getURL("/payment/success"),
		line_items: [
			{
				price: plan.stripe_price_id,
				quantity: 1,
				adjustable_quantity: {
					enabled: false,
				},
			},
		],
		mode: "subscription",
		subscription_data: {
			trial_period_days: plan.free_trial_duration,
			trial_settings: {
				end_behavior: {
					missing_payment_method: "cancel",
				},
			},
		},
	});
};

const retrieveSubscription = async (subscriptionId) => {
	return await client.subscriptions.retrieve(subscriptionId);
};

const listInvoices = async (starting_after = null, ending_before = null) => {
	let params = {
		status: "paid",
		limit: 100,
	};

	if (starting_after) params.starting_after = starting_after;
	if (ending_before) params.ending_before = ending_before;

	return await client.invoices.list(params);
};

const constructEvent = (req, sig, settings) => {
	return client.webhooks.constructEvent(req.body, sig, settings.value);
};

module.exports = {
	isEnabled,
	isWebhookEnabled,
	getClient,
	setup,
	createCustomer,
	createBillingPortalSession,
	createCheckoutSession,
	retrieveSubscription,
	listInvoices,
	constructEvent,
};
