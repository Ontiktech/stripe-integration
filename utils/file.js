const fs = require("fs");
const { isTestEnvironment } = require("./misc");

const exists = (folder, filename = null) => {
	let filepath = folder + (filename ? "/" + filename : "");
	if (isTestEnvironment()) filepath = "__tests__/" + filepath;
	return fs.existsSync(filepath);
};

const readFile = (folder, filename) => {
	let filepath = folder + "/" + filename;
	if (isTestEnvironment()) filepath = "__tests__/" + filepath;
	return fs.readFileSync(filepath);
};

const writeFile = (folder, filename, data) => {
	let filepath = folder + "/" + filename;
	if (isTestEnvironment()) filepath = "__tests__/" + filepath;
	fs.writeFileSync(filepath, data);
};

const deleteFile = (folder, filename) => {
	let filepath = folder + "/" + filename;
	if (isTestEnvironment()) filepath = "__tests__/" + filepath;
	fs.unlinkSync(filepath);
};

module.exports = { exists, readFile, writeFile, deleteFile };
