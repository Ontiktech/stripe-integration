const fs = require("fs");

const exists = (folder, filename = null) => {
	let filepath = folder + (filename ? "/" + filename : "");
	if (global.testing) filepath = "__tests__/" + filepath;
	return fs.existsSync(filepath);
};

const createDirectory = (directoryName) => {
	if (global.testing) directoryPath = "__tests__/" + directoryName;
	return fs.mkdirSync(directoryPath);
};

const readFile = (folder, filename) => {
	let filepath = folder + "/" + filename;
	if (global.testing) filepath = "__tests__/" + filepath;
	return fs.readFileSync(filepath);
};

const writeFile = (folder, filename, data) => {
	let filepath = folder + "/" + filename;
	if (global.testing) filepath = "__tests__/" + filepath;
	fs.writeFileSync(filepath, data);
};

const deleteFile = (folder, filename) => {
	let filepath = folder + "/" + filename;
	if (global.testing) filepath = "__tests__/" + filepath;
	fs.unlinkSync(filepath);
};

module.exports = { exists, createDirectory, readFile, writeFile, deleteFile };
