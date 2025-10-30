/**
 * @desc    This file contain Success and Error response for sending to client / user
 * @author  Huda Prasetyo
 * @since   2020
 */

/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */
const success = (message, results, statusCode) => {
	return {
		message,
		error: false,
		code: statusCode,
		results,
	}
}

/**
 * @desc    Send any error response
 *
 * @param   {string} message
 * @param   {object | array} results
 * @param   {number} statusCode
 */
const error = (message, results, statusCode) => {
	// List of common HTTP request code
	const codes = [200, 201, 400, 401, 404, 403, 409, 422, 500]

	// Get matched code
	const findCode = codes.find(code => code == statusCode)

	if (!findCode) statusCode = 500
	else statusCode = findCode

	return {
		message,
		code: statusCode,
		error: true,
		results,
	}
}

/**
 * @desc    Send any validation response
 *
 * @param   {object | array} errors
 */
const validation = errors => {
	return {
		message: "Validation errors",
		error: true,
		code: 422,
		errors,
	}
}

export { success, error, validation }
