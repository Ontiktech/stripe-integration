const { exists, writeFile, deleteFile, readFile } = require("./file");

const seedAll = (refresh = false) => {
	seedConfigJson(refresh);
	seedPlanJson(refresh);
	seedUsersJson(refresh);
};

const seedConfigJson = (refresh = false) => {
	if (refresh) {
		if (exists("data", "config.json")) deleteFile("data", "config.json");
		writeFile("data", "config.json", "");
	} else if (exists("data", "config.json")) return;

	let configJson = readFile("data/seeders", "config.json");
	writeFile("data", "config.json", configJson);
};

const seedPlanJson = (refresh = false) => {
	if (refresh) {
		if (exists("data", "plan.json")) deleteFile("data", "plan.json");
		writeFile("data", "plan.json", "");
	} else if (exists("data", "plan.json")) return;

	let planJson = readFile("data/seeders", "plan.json");
	writeFile("data", "plan.json", planJson);
};

const seedUsersJson = (refresh = false) => {
	if (refresh) {
		if (exists("data", "users.json")) deleteFile("data", "users.json");
		writeFile("data", "users.json", "");
	} else if (exists("data", "users.json")) return;

	let usersJson = readFile("data/seeders", "users.json");
	writeFile("data", "users.json", usersJson);
};

module.exports = {
	seedAll,
	seedConfigJson,
	seedPlanJson,
	seedUsersJson,
};
