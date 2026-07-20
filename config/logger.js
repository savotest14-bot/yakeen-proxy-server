const path = require("path");
const fs = require("fs");

/* =====================================================
   Ensure logs directory exists
====================================================== */

const logsDir = path.resolve(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/* =====================================================
   Polyfill util.isDate for simple-node-logger
   (removed in Node.js v24+)
====================================================== */

const util = require("util");
if (typeof util.isDate !== "function") {
  util.isDate = function isDate(obj) {
    return Object.prototype.toString.call(obj) === "[object Date]";
  };
}

const SimpleNodeLogger = require("simple-node-logger");

/* =====================================================
   Create Rolling File Loggers
====================================================== */

const createRollingLogger = (filename) => {
  return SimpleNodeLogger.createRollingFileLogger({
    logDirectory: logsDir,
    fileNamePattern: `${filename}-<DATE>.log`,
    dateFormat: "YYYY-MM-DD",
    timestampFormat: "YYYY-MM-DD HH:mm:ss",
    level: "info",
  });
};

/* =====================================================
   Logger Instances
====================================================== */

const yakeenLog = createRollingLogger("yakeen");
const errorLog = createRollingLogger("error");

/* =====================================================
   Sanitise — Never log passwords or tokens
====================================================== */

const SENSITIVE_KEYS = [
  "password",
  "accessToken",
  "access_token",
  "token",
  "authorization",
  "INTERNAL_SECRET",
  "app-key",
];

const sanitise = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      clone[key] = "***REDACTED***";
    } else if (typeof clone[key] === "object" && clone[key] !== null) {
      clone[key] = sanitise(clone[key]);
    }
  }
  return clone;
};

/* =====================================================
   Public API
====================================================== */

const logger = {
  info: (message, meta) => {
    const clean = meta ? sanitise(meta) : "";
    const line = meta
      ? `${message} ${JSON.stringify(clean)}`
      : message;

    yakeenLog.info(line);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[INFO] ${line}`);
    }
  },

  error: (message, meta) => {
    const clean = meta ? sanitise(meta) : "";
    const line = meta
      ? `${message} ${JSON.stringify(clean)}`
      : message;

    errorLog.error(line);
    yakeenLog.error(line);
    console.error(`[ERROR] ${line}`);
  },

  warn: (message, meta) => {
    const clean = meta ? sanitise(meta) : "";
    const line = meta
      ? `${message} ${JSON.stringify(clean)}`
      : message;

    yakeenLog.warn(line);
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[WARN] ${line}`);
    }
  },
};

module.exports = logger;
