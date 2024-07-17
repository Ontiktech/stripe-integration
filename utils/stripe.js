const stripe = require("stripe");
const { getURL } = require("./misc");

const client = process.env.STRIPE_API_KEY ? stripe(process.env.STRIPE_API_KEY) : false;

const isEnabled = () => Boolean(client);

const isWebhookEnabled = () => process.env.STRIPE_WEBHOOK_ENABLED === "true";

const getClient = () => client;

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

const retrievePrice = async (price_id) => {
	return await client.prices.retrieve(price_id);
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

const deleteOldWebhookEndpoints = async () => {
	let startingAfter = null;
	while (true) {
		let params = {
			limit: 10,
		};
		if (startingAfter) params.starting_after = startingAfter;
		let oldWebhookEndpoints = await client.webhookEndpoints.list(params);

		for (const webhookEndpoint of oldWebhookEndpoints.data) {
			if (webhookEndpoint.url === getURL("/stripe/webhooks")) {
				try {
					await client.webhookEndpoints.del(webhookEndpoint.id);
				} catch (err) {}
			}

			startingAfter = webhookEndpoint.id;
		}

		if (!oldWebhookEndpoints.has_more) break;
	}
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
		success_url: getURL("/stripe/success"),
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

const listInvoices = async (
	status = "paid",
	starting_after = null,
	ending_before = null,
	stripe_customer_id = null
) => {
	let params = {
		limit: 100,
	};

	if (status) params.status = status;
	if (starting_after) params.starting_after = starting_after;
	if (ending_before) params.ending_before = ending_before;
	if (stripe_customer_id) params.customer = stripe_customer_id;

	return await client.invoices.list(params);
};

const constructEvent = (req, sig, secret) => {
	return client.webhooks.constructEvent(req.body, sig, secret);
};

module.exports = {
	isEnabled,
	isWebhookEnabled,
	getClient,
	createProduct,
	updateProduct,
	retrievePrice,
	createPrice,
	updatePrice,
	deleteOldWebhookEndpoints,
	createWebhookEndpoints,
	createBillingPortalConfiguration,
	createCustomer,
	createBillingPortalSession,
	createCheckoutSession,
	retrieveSubscription,
	listInvoices,
	constructEvent,
};
