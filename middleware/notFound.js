const { sendError } = require("../utils/response");

/* =====================================================
   404 Not Found Handler
====================================================== */

const notFound = (req, res) => {
  return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

module.exports = notFound;
