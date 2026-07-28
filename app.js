

const { validateEnv, PORT, NODE_ENV } = require("./config/env");

validateEnv();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const rfs = require("rotating-file-stream");

const logger = require("./config/logger");

// Routes
const healthRoutes = require("./routes/health.routes");
const yakeenRoutes = require("./routes/yakeen.routes");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

/* =====================================================
   Express App
====================================================== */

const app = express();

/* ── Security ────────────────────────────────────── */

app.use(helmet());
app.disable("x-powered-by");

/* ── CORS ────────────────────────────────────────── */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ── Compression ─────────────────────────────────── */

app.use(compression());

/* ── Body Parsers — with size limits ─────────────── */

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

/* ── Rate Limiting ───────────────────────────────── */

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests — please try again later",
  },
});

app.use(limiter);

/* ── Access Logging ──────────────────────────────── */

// Create access log stream
const logsDir = path.resolve(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: logsDir,
  maxFiles: 7, // keep only the last 7 days of logs
  maxSize: "10M", // rotate if file exceeds 10MB
});

app.use(
  morgan("combined", {
    stream: accessLogStream,
    skip: (req) => req.originalUrl === "/health",
  })
);

// Console logging in development
if (NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/* ── Routes ──────────────────────────────────────── */

app.use("/health", healthRoutes);
app.use("/api/v1/yakeen", yakeenRoutes);

/* ── Error Handling ──────────────────────────────── */

app.use(notFound);
app.use(errorHandler);

/* ── Uncaught Exception / Rejection Handlers ─────── */

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", {
    message: reason?.message || String(reason),
    stack: reason?.stack,
  });
});

/* ── Start Server ────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  YAKEEN Proxy Service`);
  console.log(`  Environment : ${NODE_ENV}`);
  console.log(`  Port        : ${PORT}`);
  console.log(`  Started     : ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  logger.info(`Server started on port ${PORT} [${NODE_ENV}]`);
});

module.exports = app;
