const mysql = require("mysql2/promise");
require("dotenv").config();

// Script to FIX status ENUM in applications table
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "PGCPAITL@1234",
    database: process.env.DB_NAME || "pgcpatil-app",
};

async function fixStatusEnum() {
    console.log("Connecting...");
    const conn = await mysql.createConnection(dbConfig);

    try {
        console.log("Modifying `status` column in applications table...");

        // We want to ensure all these statuses are valid:
        // 'draft', 'payment_pending', 'submitted', 'reviewing', 'accepted', 'rejected', 'payment_rejected'

        await conn.query(`
            ALTER TABLE applications 
            MODIFY COLUMN status ENUM(
                'draft', 
                'payment_pending', 
                'submitted', 
                'reviewing', 
                'accepted', 
                'rejected', 
                'payment_rejected'
            ) DEFAULT 'draft'
        `);
        console.log("✅ Success! 'status' column updated to include 'payment_rejected'.");

    } catch (err) {
        console.error("❌ Fix Failed:", err.message);
    } finally {
        await conn.end();
    }
}

fixStatusEnum();
