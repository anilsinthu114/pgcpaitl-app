const cron = require('node-cron');
const pool = require('./config/db');
const Mailer = require('./mailer');
const { encrypt, prettyId } = require('./utils/helpers');

// Helper to send reminders
async function sendBulkReminders() {
    console.log('⏰ CRON: Checking for Second Installment Reminders...');

    try {
        // Find candidates who:
        // 1. Are 'accepted' or 'submitted'
        // 2. Have opted for 'emi'
        // 3. Paid at least 15,000 but less than 30,000 (so 2nd installment is pending)
        const [candidates] = await pool.query(`
            SELECT a.id, a.fullName, a.email,
                   (SELECT COALESCE(SUM(amount), 0) FROM application_payments 
                    WHERE application_id = a.id AND payment_type='course_fee' AND status='verified') as total_paid
            FROM applications a
            JOIN application_payments ap ON a.id = ap.application_id
            WHERE ap.payment_type = 'course_fee' AND ap.emi_option = 'emi'
            GROUP BY a.id
            HAVING total_paid >= 15000 AND total_paid < 30000
        `);

        if (candidates.length === 0) {
            console.log('✅ CRON: No pending EMI candidates found.');
            return;
        }

        console.log(`📢 CRON: Found ${candidates.length} candidates pending 2nd installment.`);

        for (const app of candidates) {
            try {
                const encryptedId = encrypt(prettyId(app.id));
                const html = Mailer.secondInstallmentReminderEmail(app, encryptedId);
                await Mailer.sendMail(app.email, "Action Required: 2nd Installment Due - PGCPAITL", html);
                console.log(`   -> Reminded: ${app.email}`);
            } catch (err) {
                console.error(`   -> Failed to remind ${app.email}:`, err.message);
            }
        }
    } catch (err) {
        console.error("🔥 CRON ERROR:", err);
    }
}

// ==========================================
// SCHEDULE: Run at 10:00 AM
// Dates: May 1st, 2nd, 3rd, 4th, 5th
// Cron syntax: "0 10 1-5 5 *" (Min Hr Day Month DayOfWeek)
// ==========================================
const job = cron.schedule('0 10 1-5 5 *', () => {
    console.log("🚀 Running Scheduled EMI Reminder Task");
    sendBulkReminders();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

module.exports = job;
