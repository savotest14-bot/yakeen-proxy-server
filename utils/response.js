/* =====================================================
   Standardised JSON Response Helpers
====================================================== */

/**
 * Send a success response.
 * @param {import("express").Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [data]
 */
const sendSuccess = (res, statusCode, message, data = undefined) => {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * @param {import("express").Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [errors]
 */
const sendError = (res, statusCode, message, errors = undefined) => {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
