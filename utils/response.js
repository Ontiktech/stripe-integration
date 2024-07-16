const sendSuccessResponse = (res, code = 200, message, data = null) => {
	res.status(code).json({
		success: true,
		message,
		data,
	});
};

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
