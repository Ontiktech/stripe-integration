const fs = require("fs");

const seedAll = () => {
	seedConfigJson();
	seedPlanJson();
	seedUsersJson();
};

const seedConfigJson = () => {
	if (fs.existsSync("data/config.json")) {
		return;
	}

	let config = { webhook_endpoints_secret: null, portal_configuration_id: null };
	let configJson = JSON.stringify(config);

	fs.writeFileSync("data/config.json", configJson, (err) => {
		if (err) throw err;
	});
};

const seedPlanJson = () => {
	if (fs.existsSync("data/plan.json")) {
		return;
	}

	let plan = {
		name: "Gold",
		description:
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eros purus, dictum at sapien vitae, rutrum molestie nisl. Sed odio metus, aliquam id fringilla in, commodo et metus.",
		price: 25,
		currency: "USD",
		duration: 30,
		free_trial_duration: 7,
		stripe_product_id: null,
		stripe_price_id: null,
	};
	let planJson = JSON.stringify(plan);

	fs.writeFileSync("data/plan.json", planJson, (err) => {
		if (err) throw err;
	});
};

const seedUsersJson = () => {
	if (fs.existsSync("data/users.json")) {
		return;
	}

	let users = [
		{
			id: 1,
			first_name: "John",
			last_name: "Doe",
			email: "johndoe@example.com",
			stripe_customer_id: null,
			stripe_subscription_id: null,
		},
	];
	let usersJson = JSON.stringify(users);

	fs.writeFileSync("data/users.json", usersJson, (err) => {
		if (err) throw err;
	});
};

module.exports = {
	seedAll,
	seedConfigJson,
	seedPlanJson,
	seedUsersJson,
};
