const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");

async function run() {
    const pool = mysql.createPool({
        host: process.env.HOST || "localhost", // .env uses HOST for server, DB likely uses DB_HOST
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "PGCPAITL@1234",
        database: process.env.DB_NAME || "pgcpatil-app",
    });

    try {
        console.log("Altering table 'applications'...");
        // Update ENUM to include 'pending'
        await pool.query("ALTER TABLE applications MODIFY COLUMN status ENUM('submitted','reviewing','accepted','rejected','pending') DEFAULT 'submitted'");
        console.log("SUCCESS: Added 'pending' to status ENUM.");
    } catch (err) {
        console.error("FAILED:", err.message);
    } finally {
        await pool.end();
    }
}

run();
