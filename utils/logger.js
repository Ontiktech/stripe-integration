const fs = require("fs");
const path = require("path");

// Function to get the log file path for the current date
const getLogFilePath = () => {
	const currentDate = new Date();
	const year = currentDate.getFullYear();
	const month = String(currentDate.getMonth() + 1).padStart(2, "0");
	const day = String(currentDate.getDate()).padStart(2, "0");
	const logFileName = `${year}-${month}-${day}.log`;
	return path.join(__dirname, "../../logs", logFileName);
};

// Function to convert data to a string for logging
const formatData = (data) => {
	if (typeof data === "object" && data !== null) {
		return JSON.stringify(data, null, 2); // Convert objects and arrays to JSON format with indentation
	} else {
		return data.toString(); // Convert other types to strings
	}
};

// Function to log messages to a file
const logToFile = (message) => {
	const logFilePath = getLogFilePath();
	const logMessage = `[${new Date().toISOString()}] ${formatData(message)}\n`;
	fs.appendFile(logFilePath, logMessage, { flag: "a" }, (err) => {
		if (err) {
			console.error("Error writing to log file:", err);
		}
	});
};

// Function to log messages to the console
const logToConsole = (message) => {
	console.log(`[${new Date().toISOString()}] ${message}`);
};

module.exports = { logToFile, logToConsole };
