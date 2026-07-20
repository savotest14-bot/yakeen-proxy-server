const { validationResult } = require("express-validator");
const { sendError } = require("../utils/response");

/* =====================================================
   Express-Validator Result Middleware
   ─────────────────────────────────────────────────────
   Runs after validator chains. Returns 422 if invalid.
====================================================== */

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));

    return sendError(res, 422, "Validation failed", formatted);
  }

  next();
};

module.exports = validateRequest;
