const mysql = require("mysql2/promise");
require("dotenv").config();

// Script to FORCE update payment_type ENUM
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "PGCPAITL@1234",
    database: process.env.DB_NAME || "pgcpatil-app",
};

async function fixEnum() {
    console.log("Connecting...");
    const conn = await mysql.createConnection(dbConfig);

    try {
        console.log("Modifying `payment_type` column definition...");
        // Re-define the column to ensure 'course_fee' is included
        await conn.query(`
            ALTER TABLE application_payments 
            MODIFY COLUMN payment_type ENUM('registration', 'course_fee') DEFAULT 'registration'
        `);
        console.log("✅ Success! payment_type column updated to include 'course_fee'.");
    } catch (err) {
        console.error("❌ Fix Failed:", err.message);
    } finally {
        await conn.end();
    }
}

fixEnum();
