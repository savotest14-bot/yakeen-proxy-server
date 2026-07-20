const logger = require("../config/logger");
const { sendError } = require("../utils/response");

/* =====================================================
   Internal Secret Authentication Middleware
   ─────────────────────────────────────────────────────
   Validates:  Authorization: Bearer <INTERNAL_SECRET>
====================================================== */

const authenticateProxy = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn("Missing Authorization header", {
      ip: req.ip,
      path: req.originalUrl,
    });
    return sendError(res, 401, "Unauthorized — missing authorization header");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    logger.warn("Malformed Authorization header", {
      ip: req.ip,
      path: req.originalUrl,
    });
    return sendError(res, 401, "Unauthorized — malformed authorization header");
  }

  const token = parts[1];

  if (token !== process.env.INTERNAL_SECRET) {
    logger.warn("Invalid internal secret", {
      ip: req.ip,
      path: req.originalUrl,
    });
    return sendError(res, 401, "Unauthorized — invalid secret");
  }

  next();
};

module.exports = authenticateProxy;
