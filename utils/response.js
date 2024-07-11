/**
 * Sends a success response with the specified status code, message, and data.
 * @param {object} res - The response object from the Express.js framework.
 * @param {number} [code=200] - The status code to be sent in the response.
 * @param {string} message - The message to be included in the response.
 * @param {*} [data=null] - The data to be included in the response.
 */
const sendSuccessResponse = (res, code = 200, message, data = null) => {
	res.status(code).json({
		success: true,
		message,
		data,
	});
};

/**
 * Sends an error response in JSON format.
 *
 * @param {object} res - The response object from the Express.js framework.
 * @param {number} [code=500] - The HTTP status code for the error response.
 * @param {string} message - The error message to be included in the response.
 * @param {*} [data=null] - Additional data to be included in the response.
 */
const sendErrorResponse = (res, code = 500, message, data = null) => {
	res.status(code).json({
		success: false,
		message,
		data,
	});
};

module.exports = {
	sendSuccessResponse,
	sendErrorResponse,
};
