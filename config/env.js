const dotenv = require("dotenv");
const path = require("path");

// Load .env file
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

/* =====================================================
   Required Environment Variables
====================================================== */

const requiredVars = [
  "PORT",
  "INTERNAL_SECRET",
  "YAKEEN_BASE_URL",
  "YAKEEN_LOGIN_URL",
  "YAKEEN_USERNAME",
  "YAKEEN_PASSWORD",
  "YAKEEN_APP_ID",
  "YAKEEN_APP_KEY",
  "YAKEEN_USAGE_CODE",
  "YAKEEN_OPERATOR_ID",
  "YAKEEN_SAUDI_SERVICE_IDENTIFIER",
  "YAKEEN_RESIDENT_SERVICE_IDENTIFIER",
];

/* =====================================================
   Validate & Export
====================================================== */

const validateEnv = () => {
  const missing = requiredVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[ENV] Missing required environment variables:\n  ${missing.join("\n  ")}`
    );
    process.exit(1);
  }
};

module.exports = {
  validateEnv,
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "production",
  INTERNAL_SECRET: process.env.INTERNAL_SECRET,

  YAKEEN_BASE_URL: process.env.YAKEEN_BASE_URL,
  YAKEEN_LOGIN_URL: process.env.YAKEEN_LOGIN_URL,
  YAKEEN_USERNAME: process.env.YAKEEN_USERNAME,
  YAKEEN_PASSWORD: process.env.YAKEEN_PASSWORD,
  YAKEEN_APP_ID: process.env.YAKEEN_APP_ID,
  YAKEEN_APP_KEY: process.env.YAKEEN_APP_KEY,
  YAKEEN_USAGE_CODE: process.env.YAKEEN_USAGE_CODE,
  YAKEEN_OPERATOR_ID: process.env.YAKEEN_OPERATOR_ID,
  YAKEEN_SAUDI_SERVICE_IDENTIFIER: process.env.YAKEEN_SAUDI_SERVICE_IDENTIFIER,
  YAKEEN_RESIDENT_SERVICE_IDENTIFIER:
    process.env.YAKEEN_RESIDENT_SERVICE_IDENTIFIER,
};
