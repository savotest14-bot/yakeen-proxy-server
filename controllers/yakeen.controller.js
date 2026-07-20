const yakeenService = require("../services/yakeen.service");
const logger = require("../config/logger");
const { sendSuccess, sendError } = require("../utils/response");

/* =====================================================
   POST /api/v1/yakeen/verify
====================================================== */

const verifyIdentity = async (req, res) => {
  const { identityType, identityNumber, dateOfBirth } = req.body;

  logger.info("Incoming verification request", {
    identityType,
    identityNumber,
    dateOfBirth,
    ip: req.ip,
  });

  try {
    const result = await yakeenService.verifyIdentity({
      identityType,
      identityNumber,
      dateOfBirth,
    });

    logger.info("Verification completed successfully", {
      identityType,
      identityNumber,
    });

    return sendSuccess(res, 200, "Identity verified successfully", result);
  } catch (error) {
    logger.error("Verification failed", {
      identityType,
      identityNumber,
      error: error.message,
    });

    // Map specific error messages to HTTP status codes
    const message = error.message || "Identity verification failed";

    if (message.includes("authentication failed")) {
      return sendError(res, 503, message);
    }

    if (message.includes("timed out")) {
      return sendError(res, 504, message);
    }

    if (message.includes("unreachable") || message.includes("unavailable")) {
      return sendError(res, 503, message);
    }

    return sendError(res, 400, message);
  }
};

module.exports = { verifyIdentity };
