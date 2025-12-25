/*******************************
 * PGCPAITL – Production Server
 * Payment-First Application Flow
 *******************************/
require("dotenv").config();

const express = require("express");
const path = require("path");
const fsSync = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { debug, info, warn, error } = require("./config/debug");

// Config & Utils
const authController = require("./controllers/authController");

// Routes
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const PORT = process.env.PORT;
const HOST = process.env.HOST;

const FILE_BASE = process.env.FILE_BASE;
// Ensure upload directories exist
fsSync.mkdirSync(FILE_BASE, { recursive: true });

/* ================= APP ================= */
const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.sheetjs.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
}));

// Simple Request Logger
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.set("trust proxy", 1);
app.use(express.static(path.join(__dirname, "public")));


/* ================= ROUTES ================= */
// Auth
app.use("/api/admin", authRoutes);

// Applications & Payments (Mounted at root due to mixed path definitions in routers)
app.use("/", applicationRoutes);
app.use("/", paymentRoutes);


/* ================= START ================= */
// Safe Error Handling
app.use((err, req, res, next) => {
  console.error("!!! GLOBAL ERROR !!!", err);
  res.status(500).json({ ok: false, error: "Internal Server Error" });
});

/* ================= START ================= */
// Ensure default admin exists
authController.ensureDefaultAdmin();

const server = app.listen(PORT, HOST, () => {
  console.log(`SERVER RUNNING → http://${HOST}:${PORT}`);
});

// Crash Handling
process.on("uncaughtException", (err) => {
  console.error("!!! UNCAUGHT EXCEPTION !!!", err);
  // Ideally, close server, but for now keep alive or log well
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("!!! UNHANDLED REJECTION !!!", reason);
});
