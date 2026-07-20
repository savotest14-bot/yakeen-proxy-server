const express = require("express");
const router = express.Router();
const { nowISO } = require("../utils/date");

/* =====================================================
   GET /health
====================================================== */

router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "UP",
    timestamp: nowISO(),
  });
});

module.exports = router;
