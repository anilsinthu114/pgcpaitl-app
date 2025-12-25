const mysql = require("mysql2/promise");
require("dotenv").config();

// Script to add payment_type column
// Run with: node scripts/add_payment_type.js

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "PGCPAITL@1234",
    database: process.env.DB_NAME || "pgcpatil-app",
};

async function migrate() {
    console.log("Connecting to database...");
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected.");

        console.log("Checking for 'payment_type' column in 'application_payments' table...");
        try {
            await connection.query("SELECT payment_type FROM application_payments LIMIT 1");
            console.log("✅ Column 'payment_type' already exists. No action needed.");
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log("⚠️ Column 'payment_type' MISSING. Adding it now...");
                await connection.query(`
                ALTER TABLE application_payments 
                ADD COLUMN payment_type ENUM('registration','course_fee') DEFAULT 'registration'
            `);
                console.log("✅ Success! 'payment_type' column added.");
            } else {
                throw err;
            }
        }
    } catch (err) {
        console.error("❌ Migration Failed:", err.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
