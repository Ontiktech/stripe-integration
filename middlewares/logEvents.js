const { format } = require("date-fns");

const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

const logEvents = async (message, logName) => {
	const time = `${format(new Date(), "HH:mm:ss")}`;
	const logItem = `${time}\t\t${message}\n`;

	try {
		if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
			await fsPromises.mkdir(path.join(__dirname, "..", "logs"));
		}

		await fsPromises.appendFile(path.join(__dirname, "..", "logs", logName), logItem);
	} catch (err) {
		console.log(err);
	}
};

const eventLogger = (req, res, next) => {
	logEvents(`${req.method}\t${req.headers.origin}\t${req.url}`, `access_${format(new Date(), "yyyyMMdd")}.txt`);
	console.log(`${req.method} ${req.path}`);
	next();
};

module.exports = { eventLogger, logEvents };
