const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const pool = require("../config/db");
const { debug, info, warn, error } = require("../config/debug");
const { prettyId, encrypt, decrypt } = require("../utils/helpers");
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
            [].concat(req.body.commMode || []).filter(Boolean).join(","),
            JSON.stringify([].concat(req.body.declarations || req.body.declaration || []).filter(Boolean)),

            // status & flow
            "pending",
            "payment_pending",
            0
        ];

        const [r] = await conn.query(sql, values);
        debug("Application draft created", r.insertId);
        const pid = prettyId(r.insertId);
        const encryptedId = encrypt(pid);
        debug("Application ID generated", pid, "Encrypted:", encryptedId);
        res.json({
            ok: true,
            application_id: pid,
            encrypted_id: encryptedId,
            redirect: `/payment.html?id=${encryptedId}`
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            warn("Duplicate application attempt", err.message);
            return res.status(409).json({ ok: false, error: "Duplicate entry: This email or mobile is already registered." });
        }
        errorLogger.error(err);
        error("Error creating application draft", err);
        res.status(500).json({ ok: false, error: err.message });
    } finally {
        conn.release();
        debug("Connection released");
    }
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

        let newStatus = 'accepted';
        let flowState = 'accepted';

        if (!isPaid) {
            warn("Submission attempted without verified payment", { id });
            newStatus = 'pending';
            flowState = 'pending';
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
            } catch (e) {
                errorLogger.error("Applicant success mail error", e);
            }
            // Standard submission email
            try {
                Mailer.sendMail(
                    process.env.ADMIN_EMAIL,
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
                warning: "pending",
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

exports.checkStatus = async (req, res) => {
    const { id, identifier } = req.query; // identifier = email or mobile
    if (!id || !identifier) return res.status(400).json({ ok: false, error: "Missing fields" });

    let decryptedId = decrypt(id);
    let dbId = decryptedId;
    if (String(decryptedId).startsWith("PGCPAITL-")) {
        dbId = Number(decryptedId.split("-").pop());
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
            prettyId: prettyId(app.id),
            encryptedId: encrypt(prettyId(app.id))
        });

    } catch (err) {
        error("Status check error", err);
        res.status(500).json({ ok: false, error: "Server error" });
    }
};

exports.resolveId = async (req, res) => {
    const { pretty } = req.query;
    if (!pretty) return res.status(400).json({ ok: false });
    try {
        const decrypted = decrypt(pretty);
        const idNum = Number(decrypted.split("-").pop());
        if (isNaN(idNum)) return res.status(400).json({ ok: false, error: "Invalid ID format" });

        // Get payment summary for course fee
        const [[courseData]] = await pool.query(
            "SELECT SUM(amount) as totalCoursePaid FROM application_payments WHERE application_id=? AND payment_type='course_fee' AND status != 'rejected'",
            [idNum]
        );

        res.json({
            ok: true,
            id: idNum,
            prettyId: decrypted,
            coursePaid: Number(courseData.totalCoursePaid || 0)
        });
    } catch (err) {
        res.status(400).json({ ok: false, error: "Invalid ID" });
    }
};


// Admin: List Applications
exports.listApplications = async (_, res) => {
    debug("Fetching admin applications");

    try {
        // AUTO-FIX & DYNAMIC SCHEMA SYNC
        // 1. Ensure emi_option column exists
        const [cols] = await pool.query("SHOW COLUMNS FROM application_payments LIKE 'emi_option'");
        if (cols.length === 0) {
            info("Dynamic Schema Sync: Adding emi_option to application_payments");
            await pool.query("ALTER TABLE application_payments ADD COLUMN emi_option ENUM('full', 'emi') DEFAULT NULL AFTER payment_type");
        }

        // 2. Fix legacy pending statuses
        await pool.query(`
    UPDATE application_payments 
    SET status = 'uploaded' 
    WHERE (utr IS NOT NULL AND utr != '') 
    AND (status = 'pending' OR status IS NULL)
  `);

        const [rows] = await pool.query(`
    SELECT a.*, 
           -- Latest (Legacy/Dashboard Support)
           (SELECT status FROM application_payments WHERE application_id = a.id ORDER BY id DESC LIMIT 1) as payment_status,
           (SELECT utr FROM application_payments WHERE application_id = a.id ORDER BY id DESC LIMIT 1) as payment_utr,
           (SELECT payment_type FROM application_payments WHERE application_id = a.id ORDER BY id DESC LIMIT 1) as payment_type,
           (SELECT updated_at FROM application_payments WHERE application_id = a.id ORDER BY id DESC LIMIT 1) as payment_updated_at,

           -- Registration Details
           (SELECT status FROM application_payments WHERE application_id = a.id AND payment_type='registration' ORDER BY id DESC LIMIT 1) as reg_status,
           (SELECT utr FROM application_payments WHERE application_id = a.id AND payment_type='registration' ORDER BY id DESC LIMIT 1) as reg_utr,
           (SELECT updated_at FROM application_payments WHERE application_id = a.id AND payment_type='registration' ORDER BY id DESC LIMIT 1) as reg_date,

           -- Course Fee Details
           (SELECT status FROM application_payments WHERE application_id = a.id AND payment_type='course_fee' ORDER BY id DESC LIMIT 1) as course_status,
           (SELECT utr FROM application_payments WHERE application_id = a.id AND payment_type='course_fee' ORDER BY id DESC LIMIT 1) as course_utr,
           (SELECT emi_option FROM application_payments WHERE application_id = a.id AND payment_type='course_fee' ORDER BY id DESC LIMIT 1) as course_emi_option,
           (SELECT COALESCE(SUM(amount), 0) FROM application_payments WHERE application_id = a.id AND payment_type='course_fee' AND status='verified') as total_course_paid,
           (SELECT updated_at FROM application_payments WHERE application_id = a.id AND payment_type='course_fee' ORDER BY id DESC LIMIT 1) as course_date

    FROM applications a
    ORDER BY a.created_at DESC
  `);
        res.json({ ok: true, items: rows });
    } catch (err) {
        error("Error listing applications", err);
        res.status(500).json({ ok: false, error: "Database error" });
    }
};

// Admin: Get Application Details
exports.getApplicationDetails = async (req, res) => {
    const id = req.params.id;
    debug("Fetching application details", { id });

    try {
        const [rows] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
        if (!rows.length) return res.status(404).json({ ok: false });

        const [files] = await pool.query("SELECT * FROM application_files WHERE application_id=?", [id]);
        const [payments] = await pool.query("SELECT * FROM application_payments WHERE application_id=? ORDER BY uploaded_at DESC", [id]);

        res.json({ ok: true, application: rows[0], files, payments });
    } catch (err) {
        error("Error fetching details", err);
        res.status(500).json({ ok: false, error: "Database error" });
    }
};

// ADMIN: Update Status
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

        // Sync flow_state with status
        await pool.query("UPDATE applications SET status=?, flow_state=? WHERE id=?", [status, status, id]);

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

// Admin: Request Course Fee (30k)
exports.requestCourseFee = async (req, res) => {
    const id = Number(req.params.id);
    debug("Requesting course fee", { id });

    try {
        const [rows] = await pool.query(`
            SELECT a.*, 
                   (SELECT status FROM application_payments WHERE application_id = a.id ORDER BY id DESC LIMIT 1) as payment_status
            FROM applications a WHERE id=?`, [id]
        );

        if (!rows.length) return res.status(404).json({ ok: false, error: "Application not found" });
        const appObj = rows[0];

        // Security: Ensure application fee is verified first
        if (appObj.payment_status !== 'verified') {
            return res.status(400).json({ ok: false, error: "Application fee not verified yet." });
        }

        try {
            Mailer.sendMail(
                appObj.email,
                `Action Required: Course Fee Payment Request - ID ${prettyId(id)}`,
                Mailer.courseFeeRequestEmail(appObj, prettyId(id))
            );
            res.json({ ok: true, message: `Course fee request sent to ${appObj.email}` });
        } catch (e) {
            errorLogger.error("Course fee mail error", e);
            res.status(500).json({ ok: false, error: "Failed to send email" });
        }
        try {
            Mailer.sendMail(
                process.env.EMAIL_CC,
                `Course Fee Request Sent - ID ${prettyId(id)}`,
                Mailer.adminCourseFeeNotificationMail(appObj, prettyId(id))
            );
        } catch (e) {
            errorLogger.error("Admin course fee mail error", e);
        }
    } catch (err) {
        error("Course fee request error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

// Admin: Send Bulk Mail (Group Mail)
exports.sendBulkMail = async (req, res) => {
    const { status, subject, message } = req.body;
    debug("Bulk mail request", { status, subject });

    if (!message || !subject) return res.status(400).json({ ok: false, error: "Subject and Message are required" });

    try {
        let query = "SELECT DISTINCT a.email, a.fullName FROM applications a";
        const params = [];

        if (status === 'pending_fee') {
            // Find those who:
            // 1. Missing verified registration fee
            // 2. Accepted but missing any course fee
            // 3. Accepted but paid < 30,000 course fee (Partial EMI)
            query = `
                SELECT DISTINCT a.email, a.fullName 
                FROM applications a
                LEFT JOIN (
                    SELECT application_id, SUM(amount) as total_reg 
                    FROM application_payments 
                    WHERE payment_type = 'registration' AND status = 'verified' 
                    GROUP BY application_id
                ) r ON a.id = r.application_id
                LEFT JOIN (
                    SELECT application_id, SUM(amount) as total_course 
                    FROM application_payments 
                    WHERE payment_type = 'course_fee' AND status = 'verified' 
                    GROUP BY application_id
                ) c ON a.id = c.application_id
                WHERE (r.total_reg IS NULL OR r.total_reg < 1000) -- No Reg Fee
                OR (a.status = 'accepted' AND (c.total_course IS NULL OR c.total_course < 30000)) -- No/Partial Course Fee
            `;
        } else if (status && status !== 'all') {
            query += " WHERE a.status=?";
            params.push(status);
        }

        const [recipients] = await pool.query(query, params);

        if (recipients.length === 0) {
            return res.json({ ok: true, count: 0, message: "No recipients found for this status." });
        }

        info(`Sending bulk mail to ${recipients.length} recipients`);

        // Send in background to avoid timeout
        let count = 0;
        // Simple loop (in production, use a queue)
        (async () => {
            console.log(`[BulkMail] Starting background send for ${recipients.length} recipients...`);
            for (const r of recipients) {
                try {
                    console.log(`[BulkMail] Sending to: ${r.email}`);
                    // personalized greeting if possible, or generic
                    const personalizedHtml = Mailer.layout(`
                        <h2 style="color:#003c7a;">Official Notification</h2>
                        <p>Dear <strong>${r.fullName || 'Applicant'}</strong>,</p>
                        <div style="font-size:14px; line-height:1.6; color:#333;">
                            ${message}
                        </div>
                        <p style="margin-top:20px;">
                            Regards,<br/>
                            <strong>PGCPAITL Admissions Team</strong>
                        </p>
                    `);

                    await Mailer.sendMail(r.email, subject, personalizedHtml);
                    console.log(`[BulkMail] Success: ${r.email}`);
                    count++;
                } catch (e) {
                    console.error(`[BulkMail] Failed: ${r.email}`, e.message);
                    errorLogger.error(`Bulk mail failed for ${r.email}`, e);
                }
            }
            console.log(`[BulkMail] Finished. Sent: ${count}/${recipients.length}`);
            info(`Bulk mail finished. Sent: ${count}/${recipients.length}`);
        })();

        res.json({ ok: true, count: recipients.length, message: `Sending to ${recipients.length} applicants in background.` });

    } catch (err) {
        error("Bulk mail error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

// Admin: Send Individual Mail
exports.sendIndividualMail = async (req, res) => {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) return res.status(400).json({ ok: false, error: "Subject and Message are required" });

    try {
        const [[app]] = await pool.query("SELECT email, fullName FROM applications WHERE id=?", [id]);
        if (!app) return res.status(404).json({ ok: false, error: "Applicant not found" });

        const personalizedHtml = Mailer.layout(`
            <h2 style="color:#003c7a;">Official Notification</h2>
            <p>Dear <strong>${app.fullName || 'Applicant'}</strong>,</p>
            <div style="font-size:14px; line-height:1.6; color:#333;">
                ${message}
            </div>
            <p style="margin-top:20px;">
                Regards,<br/>
                <strong>PGCPAITL Admissions Team</strong>
            </p>
        `);

        await Mailer.sendMail(app.email, subject, personalizedHtml);
        res.json({ ok: true, message: "Email sent successfully to " + app.email });

    } catch (err) {
        error("Individual mail error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

// Admin: Remind Second Installment
exports.remindSecondInstallment = async (req, res) => {
    const { id } = req.params;
    try {
        const [[app]] = await pool.query("SELECT id, email, fullName FROM applications WHERE id=?", [id]);
        if (!app) return res.status(404).json({ ok: false, error: "Application not found" });

        const encryptedId = encrypt(prettyId(app.id));
        const html = Mailer.secondInstallmentReminderEmail(app, encryptedId);

        await Mailer.sendMail(app.email, "Reminder: Second Installment Due - PGCPAITL", html);
        res.json({ ok: true, message: "Second installment reminder sent" });

    } catch (err) {
        error("Reminder error", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

// Admin: Download File
exports.downloadFile = async (req, res) => {
    const id = Number(req.params.id);

    try {
        const [files] = await pool.query("SELECT * FROM application_files WHERE id=?", [id]);
        if (files.length === 0) return res.status(404).send("File not found");

        const f = files[0];
        // FIX: Use FILE_BASE provided in env, fallback to project root if not set
        const basePath = process.env.FILE_BASE || path.resolve(__dirname, '..');

        // If stored_path is already absolute, use it; otherwise join with base
        const absPath = path.isAbsolute(f.stored_path) ? f.stored_path : path.join(basePath, f.stored_path);

        try {
            await fs.access(absPath);
            res.download(absPath, f.original_name);
        } catch {
            errorLogger.error("File missing on disk", { absPath });
            res.status(404).send("File missing on disk");
        }
    } catch (err) {
        error("Download error", err);
        res.status(500).send("Server Error");
    }
};

exports.uploadDocuments = async (req, res) => {
    debug("Document upload request received");

    // Debugging payload
    // debug("Body:", req.body); 
    // debug("Files keys:", Object.keys(req.files || {}));

    let { application_id } = req.body;

    // Handle case where application_id is an array (some clients/multiparts do this)
    if (Array.isArray(application_id)) {
        application_id = application_id[0];
    }

    // Strict validation: Ensure it's not just whitespace and is a valid positive number
    if (!application_id || !String(application_id).trim()) {
        errorLogger.error("Upload missing application_id", { body: req.body });
        return res.status(400).json({ ok: false, error: "Missing application ID" });
    }

    const numericId = Number(application_id);

    if (isNaN(numericId) || numericId <= 0) {
        errorLogger.error("Upload invalid application_id", { application_id });
        return res.status(400).json({ ok: false, error: "Invalid application ID" });
    }

    debug("Processing upload for App ID:", numericId);

    const conn = await pool.getConnection();

    try {
        // Verify Application Exists in DB (to prevent Foreign Key error)
        const [[appExists]] = await conn.query("SELECT id FROM applications WHERE id=?", [numericId]);

        if (!appExists) {
            errorLogger.error("Upload failed: Application ID not found in DB", { numericId });
            return res.status(404).json({ ok: false, error: "Application record not found. Please contact support." });
        }

        // SECURITY: Check if Course Fee is Paid & Verified
        const [[courseFee]] = await conn.query(
            "SELECT status FROM application_payments WHERE application_id=? AND payment_type='course_fee' ORDER BY id DESC LIMIT 1",
            [numericId]
        );

        if (!courseFee) {
            await conn.rollback();
            return res.status(403).json({
                ok: false,
                error: "Documents cannot be uploaded until the Course Fee payment is initiated."
            });
        }

        await conn.beginTransaction();

        // Save file info
        const files = req.files;
        const fileTypes = ['photo', 'id_proof', 'degree', 'marks', 'other'];
        let totalFilesUploaded = 0;

        // Define mapping for clear DB types
        const typeMapping = {
            photo: 'Passport Photo',
            id_proof: 'ID Proof',
            degree: 'Degree Certificate',
            marks: 'Marks Sheet',
            other: 'Other Documents'
        };

        for (const type of fileTypes) {
            // Check if files[type] exists and has files
            if (files[type] && files[type].length > 0) {
                // Iterate over all files for this type (supports multiple 'other' docs)
                for (const f of files[type]) {
                    const storedPath = path.join('applications', String(numericId), `doc_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}${path.extname(f.originalname)}`);

                    // Ensure directory exists
                    const fullPath = path.join(FILE_BASE, storedPath);
                    const dir = path.dirname(fullPath);
                    await fs.mkdir(dir, { recursive: true });

                    await fs.writeFile(fullPath, f.buffer);

                    await conn.query(
                        `INSERT INTO application_files (application_id, type, original_name, stored_name, stored_path, mime, size_bytes)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            numericId,
                            typeMapping[type],
                            f.originalname,
                            path.basename(storedPath), // stored_name
                            storedPath,
                            f.mimetype,
                            f.size
                        ]
                    );
                    totalFilesUploaded++; // FIX: Increment counter
                }
            }
        }

        await conn.commit();

        // Send Success Email
        try {
            const [rows] = await pool.query("SELECT * FROM applications WHERE id=?", [numericId]);
            if (rows.length > 0) {
                const appObj = rows[0];
                Mailer.sendMail(
                    appObj.email,
                    `Documents Received - Application: ${prettyId(numericId)}`,
                    Mailer.documentUploadSuccessEmail(appObj)
                );

                // Notify Admin: Course Fee & Docs (Consolidated)
                // We assume if they are uploading docs, they likely just paid the course fee.
                if (totalFilesUploaded > 0) { // FIX: Only send if files were actually processed
                    Mailer.sendMail(
                        process.env.EMAIL_FROM,
                        `Action Required: Course Fee & Documents (ID: ${prettyId(numericId)})`,
                        Mailer.adminCourseFeeAndDocsEmail(appObj, totalFilesUploaded)
                    );
                }
            }
        } catch (e) {
            errorLogger.error("Doc upload email error", e);
        }

        res.json({ ok: true, message: "Documents uploaded successfully" });

    } catch (err) {
        await conn.rollback();
        errorLogger.error("Document upload error", err);
        res.status(500).json({ ok: false, error: "Failed to save documents." });
    } finally {
        conn.release();
    }
};

exports.checkStatus = async (req, res) => {
    const { id, identifier } = req.query;

    if (!id || !identifier) {
        return res.status(400).json({ ok: false, error: "Missing ID or Identifier" });
    }

    try {
        let decryptedId = decrypt(id);
        let numericId = decryptedId;
        if (String(decryptedId).includes("-")) {
            numericId = Number(decryptedId.split("-").pop());
        }

        const [[app]] = await pool.query(
            `SELECT id, fullName, status, flow_state, email, mobile 
             FROM applications 
             WHERE id = ? AND (email = ? OR mobile = ?)`,
            [numericId, identifier, identifier]
        );

        if (app) {
            // Determine display status
            let displayStatus = app.status;
            if (app.flow_state === 'submitted') {
                // Check if payment is pending
                const [[payment]] = await pool.query(
                    "SELECT status FROM application_payments WHERE application_id=? AND payment_type='course_fee' ORDER BY id DESC LIMIT 1",
                    [app.id]
                );

                // If in submitted state but course fee not paid/verified, we might want to show that.
                // However, for simple tracking:
                displayStatus = app.status;
            }

            return res.json({
                ok: true,
                fullName: app.fullName,
                status: displayStatus,
                prettyId: prettyId(app.id)
            });
        } else {
            return res.json({ ok: false, error: "Not found" });
        }
    } catch (e) {
        errorLogger.error("Status check error", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
};

exports.checkStatusPro = async (req, res) => {
    const { id, identifier } = req.query;

    if (!id || !identifier) {
        return res.status(400).json({ ok: false, error: "Missing ID or Identifier" });
    }

    try {
        let decryptedId = decrypt(id);
        let numericId = decryptedId;
        if (String(decryptedId).includes("-")) {
            numericId = Number(decryptedId.split("-").pop());
        }

        const [[app]] = await pool.query(
            `SELECT * FROM applications 
             WHERE id = ? AND (email = ? OR mobile = ?)`,
            [numericId, identifier, identifier]
        );

        if (!app) {
            return res.json({ ok: false, error: "Application not found. Please check your ID and Registered Email/Mobile." });
        }

        // Fetch Registration Fee Payment
        const [[regPayment]] = await pool.query(
            "SELECT * FROM application_payments WHERE application_id=? AND (payment_type IS NULL OR payment_type='registration') ORDER BY id DESC LIMIT 1",
            [app.id]
        );

        // Fetch Course Fee Payment
        const [[coursePayment]] = await pool.query(
            "SELECT * FROM application_payments WHERE application_id=? AND payment_type='course_fee' ORDER BY id DESC LIMIT 1",
            [app.id]
        );

        // Fetch Documents
        const [[docCount]] = await pool.query(
            "SELECT count(*) as count FROM application_files WHERE application_id=?",
            [app.id]
        );

        // Construct Timeline Data
        const timeline = {
            step1: {
                label: "Application Initiated",
                status: "completed",
                date: app.created_at,
                details: "Application Draft Created"
            },
            step2: {
                label: "Registration Fee",
                status: regPayment ? (regPayment.status === 'verified' ? 'completed' : 'pending') : 'pending',
                date: regPayment ? regPayment.uploaded_at : null,
                details: regPayment ? `UTR: ${regPayment.utr} (${regPayment.status})` : "Payment Pending"
            },
            step3: {
                label: "Application Review",
                status: (app.flow_state === 'accepted' || app.status === 'accepted') ? 'completed' : (['submitted', 'payment_verified', 'reviewing'].includes(app.flow_state) ? 'in_progress' : 'pending'),
                date: app.submitted_at,
                details: (app.flow_state === 'accepted' || app.status === 'accepted') ? "Application Accepted" : "Under Faculty Review"
            },
            step4: {
                label: "Course Fee Payment",
                status: coursePayment ? (coursePayment.status === 'verified' ? 'completed' : 'pending') : 'pending',
                date: coursePayment ? coursePayment.uploaded_at : null,
                details: coursePayment ? `UTR: ${coursePayment.utr}` : "Payment Pending"
            },
            step5: {
                label: "Document Verification",
                status: docCount.count > 0 ? 'in_progress' : 'pending',
                date: null,
                details: docCount.count > 0 ? `${docCount.count} Documents Uploaded` : "Pending Upload"
            },
            step6: {
                label: "Final Status",
                status: app.flow_state === 'accepted' ? 'completed' : 'pending',
                date: app.accepted_at,
                details: app.flow_state === 'accepted' ? "Application Accepted" : "Pending"
            }
        };

        // Final Status Logic
        if (app.flow_state === 'accepted') {
            timeline.step3.status = 'completed';
            timeline.step3.details = "Application Accepted";
        }
        if (coursePayment && coursePayment.status === 'verified') {
            timeline.step4.status = 'completed';
            timeline.step5.status = 'completed';
        }

        return res.json({
            ok: true,
            app: {
                fullName: app.fullName,
                id: prettyId(app.id),
                email: app.email,
                mobile: app.mobile,
                course: "PGCPAITL 2025"
            },
            timeline
        });

    } catch (e) {
        errorLogger.error("Status check error", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
};

exports.checkStatusProV2 = async (req, res) => {
    const { id, identifier } = req.query;

    if (!id || !identifier) {
        return res.status(400).json({ ok: false, error: "Missing ID or Identifier" });
    }

    try {
        let decryptedId = decrypt(id);
        let numericId = decryptedId;
        if (String(decryptedId).includes("-")) {
            numericId = Number(decryptedId.split("-").pop());
        }

        const [[app]] = await pool.query(
            `SELECT * FROM applications 
             WHERE id = ? AND (email = ? OR mobile = ?)`,
            [numericId, identifier, identifier]
        );

        if (!app) {
            return res.json({ ok: false, error: "Application not found. Please check your ID and Registered Email/Mobile." });
        }

        // Fetch Registration Fee Payment
        const [[regPayment]] = await pool.query(
            "SELECT * FROM application_payments WHERE application_id=? AND (payment_type IS NULL OR payment_type='registration') ORDER BY id DESC LIMIT 1",
            [app.id]
        );

        // Fetch Course Fee Payments (Aggregated for EMI support)
        const [coursePayments] = await pool.query(
            "SELECT amount, status, utr, uploaded_at FROM application_payments WHERE application_id=? AND payment_type='course_fee' ORDER BY uploaded_at DESC",
            [app.id]
        );

        const totalCoursePaid = coursePayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const latestCoursePayment = coursePayments[0];
        const isFullPaid = totalCoursePaid >= 30000;
        const anyPending = coursePayments.some(p => p.status === 'uploaded' || p.status === 'pending');
        const allVerified = coursePayments.length > 0 && !anyPending;

        // Fetch Documents
        const [[docCount]] = await pool.query(
            "SELECT count(*) as count FROM application_files WHERE application_id=?",
            [app.id]
        );

        // Construct Timeline Data
        const timeline = {
            step1: {
                label: "Application Initiated",
                status: "completed",
                date: app.created_at,
                details: "Application Draft Created"
            },
            step2: {
                label: "Registration Fee",
                status: regPayment ? (regPayment.status === 'verified' ? 'completed' : 'in_progress') : 'pending',
                date: regPayment ? regPayment.uploaded_at : null,
                details: regPayment ? `UTR: ${regPayment.utr} (${regPayment.status === 'verified' ? 'Verified' : 'Verification Pending'})` : "Payment Pending"
            },
            step3: {
                label: "Application Review",
                status: app.flow_state === 'submitted' || app.flow_state === 'reviewing' || app.flow_state === 'accepted' ? 'in_progress' : 'pending',
                date: app.submitted_at,
                details: "Under Faculty Review"
            },
            step4: {
                label: "Course Fee Payment",
                status: totalCoursePaid > 0 ? (allVerified && isFullPaid ? 'completed' : 'in_progress') : 'pending',
                date: latestCoursePayment ? latestCoursePayment.uploaded_at : null,
                details: totalCoursePaid > 0
                    ? `Paid: ₹${totalCoursePaid.toLocaleString('en-IN')} ${isFullPaid ? '(Full)' : '(Installment)'} - ${allVerified ? 'Verified' : 'Verification Pending'}`
                    : "Waiting for Payment"
            },
            step5: {
                label: "Document Verification",
                status: docCount.count > 0 ? (allVerified && isFullPaid ? 'completed' : 'in_progress') : 'pending',
                date: null,
                details: docCount.count > 0 ? `${docCount.count} Documents Uploaded` : "Pending Upload"
            }
        };

        // Final Status Logic
        if (app.flow_state === 'accepted' || app.status === 'accepted') {
            timeline.step3.status = 'completed';
            timeline.step3.details = "Application Accepted";
        }
        if (allVerified && isFullPaid) {
            timeline.step4.status = 'completed';
            // If course fee is verified, documents are verified too
            if (docCount.count > 0) timeline.step5.status = 'completed';
        }

        return res.json({
            ok: true,
            app: {
                fullName: app.fullName,
                id: prettyId(app.id),
                encryptedId: encrypt(prettyId(app.id)),
                email: app.email,
                mobile: app.mobile,
                course: "PGCPAITL 2025",
                status: app.status,
                flow_state: app.flow_state
            },
            timeline
        });

    } catch (e) {
        errorLogger.error("Status check error", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
};
