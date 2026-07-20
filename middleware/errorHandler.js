const logger = require("../config/logger");
const { sendError } = require("../utils/response");

/* =====================================================
   Global Error Handler
   ─────────────────────────────────────────────────────
   Catches any unhandled errors thrown inside routes.
====================================================== */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;
