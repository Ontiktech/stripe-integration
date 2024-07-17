const { format } = require("date-fns");
const { sendErrorResponse } = require("../utils/response");
const { logEvents } = require("./logEvents");
const { isTestEnvironment } = require("../utils/misc");

const logError = (err, errorId = null, toFile = true, toConsole = true) => {
	if (toFile) {
		if (!errorId) errorId = Date.now();
		logEvents(`${errorId}\t\t${err.stack}\n\n`, `error_${format(new Date(), "yyyyMMdd")}.txt`);
	}
	if (toConsole) console.log(err);
};

const errorHandler = (err, req, res, next) => {
	const errorId = Date.now();
	logError(err, errorId, true, !isTestEnvironment());
	sendErrorResponse(res, 500, "Internal server error", { errorId: errorId });
	return;
};

module.exports = { errorHandler, logError };
