const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const pool = require("../config/db");
const { debug, info, warn, error } = require("../config/debug");
const { prettyId } = require("../utils/helpers");
const Mailer = require("../mailer");
const { appLogger, paymentLogger, errorLogger } = require("../logger");

const FILE_BASE = process.env.FILE_BASE;

exports.submitPayment = async (req, res) => {
    const { application_id, utr } = req.body;
    debug("Payment submission request received", req.body);
    if (!application_id || !utr)
        return res.status(400).json({ ok: false });
    debug("Validation passed, creating payment submission");

    const numericId = Number(application_id.split("-").pop());
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [[appRow]] = await conn.query(
            "SELECT id,email,fullName FROM applications WHERE id=?",
            [numericId]
        );
        if (!appRow) throw new Error("Invalid application");

        const dir = path.join(FILE_BASE, "payments", String(numericId));
        fsSync.mkdirSync(dir, { recursive: true });

        let screenshotPath = null;
        if (req.file) {
            screenshotPath = path.join(dir, `payment_${Date.now()}.png`);
            await fs.writeFile(screenshotPath, req.file.buffer);
        }

        // Check for duplicate UTR usage
        const [[existingPayment]] = await conn.query(
            "SELECT id, status FROM application_payments WHERE utr=? LIMIT 1",
            [utr]
        );

        if (existingPayment) {
            warn(`Duplicate payment submission attempt for UTR: ${utr}`);
            await conn.rollback();

            // If it's the same application, treat as success (idempotency)
            // But if status is already 'verified', we might alert? 
            // For now, consistent with user request "add payment done status if any duplicates", we just return OK.

            let redirectUrl = null;
            if (req.body.payment_type === 'course_fee' || (Array.isArray(req.body.payment_type) && req.body.payment_type[0] === 'course_fee')) {
                const pid = prettyId(numericId);
                redirectUrl = `/upload-documents.html?id=${pid}`;
            }

            return res.json({ ok: true, message: "Payment already submitted", redirect: redirectUrl, status: 'duplicate' });
        }

        const paymentType = Array.isArray(req.body.payment_type) ? req.body.payment_type[0] : (req.body.payment_type || 'registration');

        // Strict Amount Enforcer
        let finalAmount = 1000;
        if (paymentType === 'course_fee') {
            finalAmount = 30000;
        } else {
            finalAmount = 1000;
        }

        const [r] = await conn.query(
            `INSERT INTO application_payments
         (application_id,utr,screenshot_path,status,payment_type,amount)
         VALUES (?,?,?,?,?,?)`,
            [numericId, utr, screenshotPath, 'uploaded', paymentType, finalAmount]
        );
        const paymentId = `PGCPAITL-Pay-${String(r.insertId).padStart(6, "0")}`;
        debug("Payment submission created", r.insertId);
        debug("Payment submission created", { application_id, utr, screenshotPath });
        if (!req.body.payment_type || req.body.payment_type === 'registration') {
            await conn.query(
                "UPDATE applications SET status='submitted', flow_state='submitted', submitted_at=NOW() WHERE id=? AND status='draft'",
                [numericId]
            );
            debug("Application status updated to submitted (Registration Fee)");
        }

        await conn.commit();

        debug("Payment submission committed");

        debug("Sending payment received email", { email: appRow.email });
        Mailer.sendMail(
            appRow.email,
            "PGCPAITL – Payment Received",
            Mailer.paymentReceivedEmail(
                appRow,
                paymentId,
                prettyId(numericId),
                utr
            )
        );
        debug("Payment received email sent");

        // Notify Admin (ONLY for Registration Fee, Course Fee handled after docs)
        const pType = Array.isArray(req.body.payment_type) ? req.body.payment_type[0] : (req.body.payment_type || 'registration');

        if (pType !== 'course_fee') {
            try {
                Mailer.sendMail(
                    process.env.EMAIL_FROM,
                    `Action Required: New Payment Uploaded (ID: ${paymentId})`,
                    Mailer.adminPaymentUploadedEmail(appRow, paymentId, prettyId(numericId), utr)
                );
            } catch (e) { errorLogger.error("Admin payment mail error", e); }
        }

        paymentLogger.info("Payment uploaded", { application_id });
        debug("Payment uploaded", { application_id });

        let redirectUrl = null;
        if (req.body.payment_type === 'course_fee' || (Array.isArray(req.body.payment_type) && req.body.payment_type[0] === 'course_fee')) {
            // Logic to redirect
            const pid = prettyId(numericId);
            redirectUrl = `/upload-documents.html?id=${pid}`;
        }

        res.json({ ok: true, message: "Payment submitted", redirect: redirectUrl });

    } catch (err) {
        await conn.rollback();
        errorLogger.error(err);
        error("Error creating payment submission", err);
        res.status(500).json({ ok: false, error: err.message });
    } finally {
        conn.release();
        debug("Connection released");
    }
};

exports.verifyPayment = async (req, res) => {
    const id = Number(req.params.id);
    debug("Payment verification request received", req.params);
    const conn = await pool.getConnection();

    try {
        debug("Beginning transaction");
        await conn.beginTransaction();
        debug("Transaction begun");

        debug("Updating payment status to verified", { id });
        await conn.query(
            "UPDATE application_payments SET status='verified' WHERE id=?",
            [id]
        );
        debug("Payment status updated to verified", { id });

        debug("Fetching payment application ID", { id });
        const [[p]] = await conn.query(
            "SELECT application_id FROM application_payments WHERE id=?",
            [id]
        );
        debug("Payment application ID fetched", { application_id: p.application_id });
        debug("Updating application flow state to payment_verified", { application_id: p.application_id });
        await conn.query(
            `UPDATE applications
       SET flow_state='payment_verified'
       WHERE id=?`,
            [p.application_id]
        );
        debug("Application flow state updated to payment_verified", { application_id: p.application_id });
        await conn.commit();

        debug("Sending payment status update email", { application_id: p.application_id });

        // Fetch app details for email
        const [[appInfo]] = await conn.query("SELECT email, fullName FROM applications WHERE id=?", [p.application_id]);
        if (appInfo) {
            const pid = prettyId(p.application_id);
            Mailer.sendMail(
                appInfo.email,
                `PGCPAITL – Payment Verified (ID: ${pid})`,
                Mailer.paymentVerifiedEmail(appInfo, pid)
            );
        }
        debug("Payment status update email sent", { application_id: p.application_id });

        debug("Payment verification completed", { id });
        res.json({ ok: true });

    } catch (err) {
        await conn.rollback();
        errorLogger.error(err);
        error("Error verifying payment", err);
        res.status(500).json({ ok: false });
    } finally {
        conn.release();
        debug("Connection released");
    }
};

exports.rejectPayment = async (req, res) => {
    const id = Number(req.params.id);
    debug("Payment rejection request", { id });

    try {
        const [rows] = await pool.query("SELECT * FROM application_payments WHERE id=?", [id]);
        if (!rows.length) return res.status(404).json({ ok: false, error: "Payment not found" });

        const payment = rows[0];
        const appId = payment.application_id;

        await pool.query("UPDATE application_payments SET status='rejected' WHERE id=?", [id]);
        await pool.query("UPDATE applications SET status='rejected' WHERE id=?", [appId]);

        const [apps] = await pool.query("SELECT email, fullName FROM applications WHERE id=?", [appId]);
        if (apps.length > 0) {
            try {
                const pid = prettyId(appId);
                Mailer.sendMail(
                    apps[0].email,
                    `PGCPAITL – Payment Rejected (ID: ${pid})`,
                    Mailer.paymentRejectedEmail(apps[0], pid)
                );
            } catch (e) { warn("Failed to send rejection mail", e); }
        }

        res.json({ ok: true });
    } catch (err) {
        error("Payment rejection error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

exports.listPayments = async (req, res) => {
    debug("Fetching all payments list");
    try {
        const [rows] = await pool.query(`
      SELECT p.id, p.application_id, p.utr, p.status, p.uploaded_at, p.payment_type, p.amount,
             a.fullName, a.email, a.mobile
      FROM application_payments p
      JOIN applications a ON p.application_id = a.id
      ORDER BY p.uploaded_at DESC
    `);
        res.json({ ok: true, payments: rows });
    } catch (err) {
        error("Error fetching payments list", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

exports.getScreenshot = async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await pool.query("SELECT screenshot_path FROM application_payments WHERE id=?", [id]);

    if (rows.length === 0 || !rows[0].screenshot_path) {
        return res.status(404).send("Screenshot not found");
    }

    const fPath = rows[0].screenshot_path;
    const projectRoot = path.resolve(__dirname, '..');
    // Ensure path is correct relative to root if stored relative
    const absPath = path.isAbsolute(fPath) ? fPath : path.resolve(fPath);

    try {
        await fs.access(absPath);
        res.sendFile(absPath);
    } catch (e) {
        errorLogger.error("Screenshot missing", e);
        res.status(404).send("File missing on disk");
    }
};
