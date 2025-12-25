const mysql = require("mysql2/promise");
require("dotenv").config();

// Fix for production issues where is_legacy column is missing
// Run with: node scripts/add_is_legacy_column.js

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

        console.log("Checking for 'is_legacy' column in 'applications' table...");
        try {
            await connection.query("SELECT is_legacy FROM applications LIMIT 1");
            console.log("✅ Column 'is_legacy' already exists. No action needed.");
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                console.log("⚠️ Column 'is_legacy' MISSING. Adding it now...");
                await connection.query(`
                ALTER TABLE applications 
                ADD COLUMN is_legacy BOOLEAN DEFAULT FALSE
            `);
                console.log("✅ Success! 'is_legacy' column added.");
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
