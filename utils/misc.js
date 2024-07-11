const getURL = (path) => {
	return process.env.APP_URL + path;
};

module.exports = {
	getURL,
};
