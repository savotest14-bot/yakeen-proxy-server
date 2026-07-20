const express = require("express");
const router = express.Router();

const authenticateProxy = require("../middleware/authenticateProxy");
const validateRequest = require("../middleware/validateRequest");
const { verifyValidator } = require("../validators/verify.validator");
const yakeenController = require("../controllers/yakeen.controller");

/* =====================================================
   POST /api/v1/yakeen/verify
====================================================== */

router.post(
  "/verify",
  authenticateProxy,
  verifyValidator,
  validateRequest,
  yakeenController.verifyIdentity
);

module.exports = router;
