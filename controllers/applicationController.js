const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const pool = require("../config/db");
const { debug, info, warn, error } = require("../config/debug");
const { prettyId } = require("../utils/helpers");
const Mailer = require("../mailer");
const { appLogger, paymentLogger, errorLogger } = require("../logger");

const FILE_BASE = process.env.FILE_BASE;

exports.createDraft = async (req, res) => {
    debug("Application draft request received", req.body);
    const conn = await pool.getConnection();
    try {
        debug("Creating application draft");
        const sql = `
   INSERT INTO applications (
  fullName, parentName, dob, gender, category, nationality, aadhaar,
  mobile, whatsapp, email, address, city, district, state, pin, country,
  degreeLevel, specialization, institutionName, university, passingYear,
  studyMode, percentage,
  employmentStatus, organisation, designation, sector, experience,
  sop, commMode, declarations,
  created_at, submitted_at,
  status, flow_state, is_legacy
) VALUES (
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,?,?,?,?,?,?,?,?,?,
  ?,
  NOW(),NOW(),
  ?,?,?
)`;

        const values = [
            // Personal
            req.body.fullName,
            req.body.parentName,
            req.body.dob,
            req.body.gender,
            req.body.category,
            req.body.nationality,
            req.body.aadhaar || null,

            // Contact
            req.body.mobile || null,
            req.body.whatsapp,
            req.body.email,
            req.body.address,
            req.body.city,
            req.body.district,
            req.body.state,
            req.body.pin,
            req.body.country,

            // Academic
            req.body.degreeLevel,
            req.body.specialization,
            req.body.institutionName,
            req.body.university,
            req.body.passingYear,
            req.body.studyMode,
            req.body.percentage,

            // Employment
            req.body.employmentStatus || null,
            req.body.organisation || null,
            req.body.designation || null,
            req.body.sector || null,
            req.body.experience || null,

            // SOP & declarations
            req.body.sop || null,
            (req.body.commMode || []).join(","),
            JSON.stringify(req.body.declarations || []),

            // status & flow
            "payment_pending",
            "draft",
            0
        ];

        const [r] = await conn.query(sql, values);
        debug("Application draft created", r.insertId);
        const pid = prettyId(r.insertId);
        debug("Application ID generated", pid);
        res.json({
            ok: true,
            application_id: pid,
            redirect: `/payment.html?id=${pid}`
        });
    } catch (err) {
        errorLogger.error(err);
        error("Error creating application draft", err);
        res.status(500).json({ ok: false, error: err.message });
    } finally {
        conn.release();
        debug("Connection released");
    }
};

exports.checkStatus = async (req, res) => {
    const { id, identifier } = req.query; // identifier = email or mobile
    if (!id || !identifier) return res.status(400).json({ ok: false, error: "Missing fields" });

    let dbId = id;
    if (String(id).startsWith("PGCPAITL-")) {
        dbId = Number(id.split("-").pop());
    }

    try {
        const [rows] = await pool.query(
            "SELECT id, fullName, flow_state, status FROM applications WHERE id=? AND (email=? OR mobile=?)",
            [dbId, identifier, identifier]
        );

        if (rows.length === 0) return res.status(404).json({ ok: false, error: "Not found" });

        const app = rows[0];
        res.json({
            ok: true,
            status: app.status,
            flow_state: app.flow_state,
            fullName: app.fullName,
            prettyId: prettyId(app.id)
        });

    } catch (err) {
        error("Status check error", err);
        res.status(500).json({ ok: false, error: "Server error" });
    }
};

exports.resolveId = (req, res) => {
    const { pretty } = req.query;
    if (!pretty) return res.status(400).json({ ok: false });
    const id = Number(pretty.split("-").pop());
    if (isNaN(id)) return res.status(400).json({ ok: false, error: "Invalid ID format" });
    res.json({ ok: true, id });
};

exports.submitApplication = async (req, res) => {
    const id = Number(req.params.id);
    debug("Application submit request received", req.params);
    const conn = await pool.getConnection();

    try {
        debug("Beginning transaction");
        await conn.beginTransaction();

        // 1. Check for VERIFIED payment
        const [payments] = await conn.query(
            "SELECT id, status FROM application_payments WHERE application_id=? AND status='verified'",
            [id]
        );

        const isPaid = payments.length > 0;

        let newStatus = 'submitted';
        let flowState = 'submitted';

        if (!isPaid) {
            warn("Submission attempted without verified payment", { id });
            newStatus = 'payment_pending';
            flowState = 'payment_pending';
        }

        // 2. Update Application Status
        debug(`Updating status to ${newStatus}`, { id });
        await conn.query(
            "UPDATE applications SET flow_state=?, status=? WHERE id=?",
            [flowState, newStatus, id]
        );

        // 3. Commit Transaction
        await conn.commit();

        // 4. Send appropriate email
        const [[appObj]] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
        const pid = prettyId(id);

        if (isPaid) {
            debug("Payment verified, sending submission success email");

            // Notify Applicant (NEW)
            try {
                Mailer.sendMail(
                    appObj.email,
                    `PGCPAITL Application Submitted & Verified – ID ${pid}`,
                    Mailer.applicationVerifiedSuccessEmail(appObj, pid)
                );
            } catch (e) { errorLogger.error("Applicant success mail error", e); }

            // Standard submission email
            try {
                Mailer.sendMail(
                    process.env.EMAIL_FROM,
                    `New PGCPAITL Application Submitted – ID ${pid}`,
                    Mailer.adminNotificationEmail(appObj, pid)
                );
            } catch (e) { errorLogger.error("Admin mail error", e); }

        } else {
            debug("Payment NOT verified, sending payment pending email");
            try {
                Mailer.sendMail(
                    appObj.email,
                    `PGCPAITL – Action Required: Payment Pending (ID: ${pid})`,
                    Mailer.paymentPendingEmail(appObj, pid)
                );
            } catch (e) { errorLogger.error("Payment pending mail error", e); }

            return res.json({
                ok: true,
                warning: "payment_pending",
                message: "Application submitted but awaiting payment verification."
            });
        }

        res.json({ ok: true });

    } catch (err) {
        await conn.rollback();
        error("Error submitting application", err);
        res.status(500).json({ ok: false, error: err.message });
    } finally {
        conn.release();
    }
};

// Admin: List Applications
exports.listApplications = async (_, res) => {
    debug("Fetching admin applications");

    // AUTO-FIX
    await pool.query(`
    UPDATE application_payments 
    SET status = 'uploaded' 
    WHERE (utr IS NOT NULL AND utr != '') 
    AND (status = 'pending' OR status IS NULL)
  `);

    const [rows] = await pool.query(`
    SELECT a.*, 
           (SELECT status FROM application_payments WHERE application_id = a.id ORDER BY id DESC LIMIT 1) as payment_status,
           (SELECT utr FROM application_payments WHERE application_id = a.id ORDER BY id DESC LIMIT 1) as payment_utr
    FROM applications a
    ORDER BY a.created_at DESC
  `);
    res.json({ ok: true, items: rows });
};

// Admin: Get Application Details
exports.getApplicationDetails = async (req, res) => {
    const id = req.params.id;
    debug("Fetching application details", { id });
    const [rows] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ ok: false });

    const [files] = await pool.query("SELECT * FROM application_files WHERE application_id=?", [id]);
    const [payments] = await pool.query("SELECT * FROM application_payments WHERE application_id=? ORDER BY uploaded_at DESC", [id]);

    res.json({ ok: true, application: rows[0], files, payments });
};

// Admin: Update Status
exports.updateApplicationStatus = async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    debug("Updating status", { id, status });

    if (!["submitted", "reviewing", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    try {
        const [apps] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
        if (apps.length === 0) return res.status(404).json({ ok: false, error: "not found" });
        const appObj = apps[0];

        await pool.query("UPDATE applications SET status=? WHERE id=?", [status, id]);

        try {
            Mailer.sendMail(
                appObj.email,
                `PGCPAITL Application Status Updated – ID ${id}`,
                Mailer.statusUpdateEmail(appObj, status)
            );
        } catch (e) { errorLogger.error("Status email failed", e); }

        res.json({ ok: true });
    } catch (err) {
        error("Update status error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};


// Admin: Send Payment Reminder
exports.sendPaymentReminder = async (req, res) => {
    const id = Number(req.params.id);
    debug("Sending payment reminder", { id });

    try {
        const [rows] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
        if (!rows.length) return res.status(404).json({ ok: false, error: "not found" });
        const appObj = rows[0];

        try {
            Mailer.sendMail(
                appObj.email,
                `Reminder: Payment Pending for Application ${prettyId(id)}`,
                Mailer.paymentPendingEmail(appObj, prettyId(id))
            );
            res.json({ ok: true, message: "Reminder sent to " + appObj.email });
        } catch (e) {
            errorLogger.error("Reminder mail error", e);
            res.status(500).json({ ok: false, error: "Failed to send email" });
        }
    } catch (err) {
        error("Reminder error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

// Admin: Download File
exports.downloadFile = async (req, res) => {
    const id = Number(req.params.id);
    const [files] = await pool.query("SELECT * FROM application_files WHERE id=?", [id]);
    if (files.length === 0) return res.status(404).send("File not found");

    const f = files[0];
    // Assuming root dir is roughly where server.js is
    // When using path.join(__dirname), inside controller it is different.
    // The stored path in DB might be relative to project root or absolute.
    // server.js logic: path.join(__dirname, f.stored_path)
    // If f.stored_path is "uploads/...", server.js (root) works.
    // Here we are in controllers/. We need to go up one level.
    const projectRoot = path.resolve(__dirname, '..');
    const absPath = path.isAbsolute(f.stored_path) ? f.stored_path : path.join(projectRoot, f.stored_path);

    try {
        await fs.access(absPath);
        res.download(absPath, f.original_name);
    } catch {
        res.status(404).send("File missing on disk");
    }
};
