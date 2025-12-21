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
app.use(helmet());
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
// Ensure default admin exists
authController.ensureDefaultAdmin();

app.listen(PORT, HOST, () => {
  console.log(`SERVER RUNNING → http://${HOST}:${PORT}`);
});
