const isTestEnvironment = () => {
	return process.env.NODE_ENV === "test" || process.env.NODE_ENV === undefined;
};

const getURL = (path) => {
	return process.env.APP_URL + path;
};

module.exports = {
	isTestEnvironment,
	getURL,
};
