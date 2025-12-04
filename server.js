/*******************************
 * server.js
 * MySQL backend for PGCPAITL form
 * FILE PROCESSING COMMENTED OUT (but kept for future)
 *******************************/
require('dotenv').config();
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const Mailer = require("mailer");
const mailer = require("./mailer");

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const FILE_BASE = process.env.FILE_BASE || path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
const ALLOWED_MIMES = (process.env.ALLOWED_MIMES || 'application/pdf,image/jpeg,image/png,image/jpg').split(',');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// --- MySQL pool ---
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// ensure uploads directory exists
fsSync.mkdirSync(FILE_BASE, { recursive: true });

// nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_SECURE === 'true'),
  auth: {
    user: process.env.SMTP_USER || 'applicationspgcpaitl@gmail.com',
    pass: process.env.SMTP_PASS || 'jqbsayhsvfmdefyg'
  }
});

// === Multer configuration (file validation active) ===
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Invalid mime type: ' + file.mimetype));
    }
    cb(null, true);
  }
});

// For now: allow incoming files but DO NOT PROCESS THEM
const multerMiddleware = upload.any();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));
app.set("trust proxy", 1);

app.use(express.static(path.join(__dirname, 'public')));

// ---------- Utility ----------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildOrigin(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

// ---------- Auto-create default admin ----------
async function ensureDefaultAdmin() {
  const [rows] = await pool.query("SELECT COUNT(*) AS c FROM admin_users");
  if (rows[0].c === 0) {
    const user = process.env.ADMIN_DEFAULT_USER || "admin";
    const pass = process.env.ADMIN_DEFAULT_PASS || "Admin@1234";
    const hash = await bcrypt.hash(pass, 10);
    await pool.query("INSERT INTO admin_users (username,password_hash) VALUES (?,?)", [user, hash]);
    console.log("Default admin user created:", user);
  }
}
ensureDefaultAdmin().catch(console.error);

// ---------- Admin auth ----------
function adminAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ ok: false, error: "no auth" });
  const [scheme, token] = h.split(" ");
  if (scheme !== "Bearer") return res.status(401).json({ ok: false, error: "bad auth" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "invalid token" });
  }
}

// ---------- Insert application ----------
async function insertApplication(conn, obj) {
  const sql = `
    INSERT INTO applications
    (fullName,parentName,dob,gender,category,nationality,aadhaar,mobile,whatsapp,email,address,city,district,state,pin,country,
     degreeLevel,specialization,university,passingYear,studyMode,percentage,employmentStatus,organisation,designation,sector,experience,
     sop,commMode,declarations,submitted_at,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),'submitted')
  `;

  const comm = Array.isArray(obj.commMode) ? obj.commMode.join(",") : null;
  const dec = JSON.stringify(obj.declaration || []);

  const params = [
    obj.fullName, obj.parentName, obj.dob, obj.gender, obj.category, obj.nationality, obj.aadhaar || null,
    obj.mobile, obj.whatsapp || null, obj.email, obj.address, obj.city, obj.district, obj.state, obj.pin, obj.country,
    obj.degreeLevel, obj.specialization, obj.university, parseInt(obj.passingYear, 10) || null,
    obj.studyMode, obj.percentage, obj.employmentStatus || null, obj.organisation || null,
    obj.designation || null, obj.sector || null, obj.experience || null,
    obj.sop, comm, dec
  ];

  const [res] = await conn.query(sql, params);
  return res.insertId;
}


//  // 1️⃣ ANNOUNCEMENT TEMPLATE (sent to applicant)
//         const announcementEmail = `
// <div style="padding:16px;border-left:5px solid #f39c12;background:#fff7ed;border-radius:8px;font-family:Arial;">
//   <h2 style="color:#b45309;margin:0 0 10px 0;">Important Information for Applicants</h2>
//   <p>Applicants may submit the Online Application Form through the portal at present.</p>

//   <p>
//     The <strong>₹1,000/- non-refundable registration fee</strong> payment link 
//     will be activated shortly on the same portal.  
//     You will receive automatic <strong>Email / SMS notifications</strong> once the payment gateway is live.
//   </p>

//   <p><strong>All applications shall remain provisional until payment is completed.</strong></p>
//   <p>The registration fee is strictly non-refundable.</p>

//   <p style="margin-top:10px;">
//     For official updates, visit:  
//     <a href="https://pgcpaitl.jntugv.edu.in" target="_blank">pgcpaitl.jntugv.edu.in</a>
//   </p>
// </div>
// `;


//         // 2️⃣ APPLICATION SUBMISSION ACKNOWLEDGEMENT — applicant
//         const applicantSubmissionEmail = (appObj, applicationId) => `
// ${announcementEmail}

// <h2 style="color:#004c97;font-family:Arial;">Your Application is Received</h2>
// <p>Dear <strong>${escapeHtml(appObj.fullName)}</strong>,</p>

// <p>Your application has been successfully submitted.</p>

// <p><strong>Application ID:</strong> ${applicationId}</p>

// <h3 style="color:#004c97;margin-top:20px;">Applicant Details</h3>
// <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;">
//   <tr><td><b>Name:</b></td><td>${escapeHtml(appObj.fullName)}</td></tr>
//   <tr><td><b>Father/Mother:</b></td><td>${escapeHtml(appObj.parentName)}</td></tr>
//   <tr><td><b>Email:</b></td><td>${escapeHtml(appObj.email)}</td></tr>
//   <tr><td><b>Mobile:</b></td><td>${escapeHtml(appObj.mobile)}</td></tr>
//   <tr><td><b>Qualification:</b></td><td>${escapeHtml(appObj.degreeLevel)}</td></tr>
//   <tr><td><b>Specialization:</b></td><td>${escapeHtml(appObj.specialization)}</td></tr>
//   <tr><td><b>University:</b></td><td>${escapeHtml(appObj.university)}</td></tr>
//   <tr><td><b>Year of Passing:</b></td><td>${escapeHtml(appObj.passingYear)}</td></tr>
// </table>

// <p style="margin-top:12px;">
// You will be notified once the payment portal is activated.
// </p>

// <p>Regards,<br>
// <strong>PGCPAITL Admissions Team</strong><br>
// JNTU-GV & DSNLU</p>
// `;


//         // 3️⃣ NOTIFICATION TO AUTHORITY — admin
//         const adminNotificationEmail = (appObj, applicationId) => `
// <h2 style="color:#004c97;font-family:Arial;">New PGCPAITL Application Submitted</h2>

// <p>A new application has been received.</p>

// <p><strong>Application ID:</strong> ${applicationId}</p>

// <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-family:Arial;">
//   <tr><td><b>Name:</b></td><td>${escapeHtml(appObj.fullName)}</td></tr>
//   <tr><td><b>Email:</b></td><td>${escapeHtml(appObj.email)}</td></tr>
//   <tr><td><b>Mobile:</b></td><td>${escapeHtml(appObj.mobile)}</td></tr>
//   <tr><td><b>Qualification:</b></td><td>${escapeHtml(appObj.degreeLevel)}</td></tr>
//   <tr><td><b>Status:</b></td><td>submitted</td></tr>
// </table>
// `;


//         // 4️⃣ STATUS UPDATE EMAIL (to applicant)
//         const statusUpdateEmail = (appObj, newStatus) => `
// <h2 style="color:#004c97;font-family:Arial;">Your Application Status Has Changed</h2>
// <p>Dear ${escapeHtml(appObj.fullName)},</p>

// <p>Your PGCPAITL application status has been updated.</p>

// <p><strong>New Status:</strong> ${newStatus}</p>

// <p>You may log in to the portal for details.</p>

// <p>Regards,<br>
// PGCPAITL Admissions Team</p>
// `;


//         // 5️⃣ PAYMENT ACTIVATION EMAIL (to applicant)
//         const paymentActivationEmail = (appObj, applicationId) => `
// <h2 style="color:#004c97;font-family:Arial;">Registration Fee Payment Activated</h2>

// <p>Dear ${escapeHtml(appObj.fullName)},</p>

// <p>Your application (ID <strong>${applicationId}</strong>) is now ready for payment.</p>

// <p>Please pay the <strong>₹1,000 non-refundable registration fee</strong> to proceed with the admission process.</p>

// <p><a href="https://pgcpaitl.jntugv.edu.in/pay" 
//    style="padding:10px 18px;background:#004c97;color:#fff;border-radius:6px;text-decoration:none;">
//    Pay Registration Fee
// </a></p>

// <p>Regards,<br>PGCPAITL Admissions Team</p>
// `;


// ===================================================================
// 🔵 APPLICATION SUBMIT — FILE UPLOAD LOGIC COMMENTED (NOT REMOVED)
// ===================================================================
app.post(
  "/application/submit",
  multerMiddleware, // accept files but DO NOT PROCESS THEM
  // === VALIDATION ===
  body("fullName").notEmpty(),
  body("parentName").notEmpty(),
  body("dob").notEmpty(),
  body("gender").notEmpty(),
  body("category").notEmpty(),
  body("nationality").notEmpty(),
  body("mobile").notEmpty(),
  body("email").isEmail(),
  body("address").notEmpty(),
  body("city").notEmpty(),
  body("district").notEmpty(),
  body("state").notEmpty(),
  body("pin").notEmpty(),
  body("country").notEmpty(),
  body("degreeLevel").notEmpty(),
  body("specialization").notEmpty(),
  body("university").notEmpty(),
  body("passingYear").notEmpty(),
  body("studyMode").notEmpty(),
  body("percentage").notEmpty(),
  body("sop").notEmpty(),
  async (req, res) => {
    try {
      console.log("REQ.BODY:", req.body);
      console.log("REQ.FILES:", req.files?.length || 0, "files received");

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });

      // normalize arrays
      const declarations = Array.isArray(req.body.declaration)
        ? req.body.declaration
        : req.body.declaration ? [req.body.declaration] : [];

      const commMode = Array.isArray(req.body.commMode)
        ? req.body.commMode
        : req.body.commMode ? [req.body.commMode] : [];

      const appObj = {
        fullName: req.body.fullName,
        parentName: req.body.parentName,
        dob: req.body.dob,
        gender: req.body.gender,
        category: req.body.category,
        nationality: req.body.nationality,
        aadhaar: req.body.aadhaar || null,
        mobile: req.body.mobile,
        whatsapp: req.body.whatsapp || null,
        email: req.body.email,
        address: req.body.address,
        city: req.body.city,
        district: req.body.district,
        state: req.body.state,
        pin: req.body.pin,
        country: req.body.country,
        degreeLevel: req.body.degreeLevel,
        specialization: req.body.specialization,
        university: req.body.university,
        passingYear: req.body.passingYear,
        studyMode: req.body.studyMode,
        percentage: req.body.percentage,
        employmentStatus: req.body.employmentStatus || null,
        organisation: req.body.organisation || null,
        designation: req.body.designation || null,
        sector: req.body.sector || null,
        experience: req.body.experience || null,
        sop: req.body.sop,
        commMode,
        declaration: declarations
      };

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const applicationId = await insertApplication(conn, appObj);

        // --------------------------------------------------------
        // 🔶 FILE UPLOAD STORAGE (COMMENTED OUT)
        // --------------------------------------------------------
        /*
        const fileTypesMap = {
          photo: "photo",
          idProof: "id_proof",
          degreeCert: "degree_certificate",
          marksheets: "marksheets",
          supportDocs: "support_docs"
        };

        if (req.files && req.files.length > 0) {
          const dir = path.join(FILE_BASE, 'applications', String(applicationId));
          await fs.mkdir(dir, { recursive: true });

          for (const f of req.files) {
            if (!fileTypesMap[f.fieldname]) continue;

            const ext = path.extname(f.originalname);
            const safeName = `${fileTypesMap[f.fieldname]}_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 8)}${ext}`;
            const storedPath = path.join(dir, safeName);

            await fs.writeFile(storedPath, f.buffer, { mode: 0o640 });

            await conn.query(
              `INSERT INTO application_files (application_id,type,original_name,stored_name,stored_path,mime,size_bytes)
               VALUES (?,?,?,?,?,?,?)`,
               [
                 applicationId,
                 fileTypesMap[f.fieldname],
                 f.originalname,
                 safeName,
                 storedPath,
                 f.mimetype,
                 f.size
               ]
            );
          }
        }
        */
        // --------------------------------------------------------
        // END FILE BLOCK
        // --------------------------------------------------------

        await conn.commit();

        /***************************************************************
         * EMAIL TEMPLATES (ALL 5 INCLUDED)
         ***************************************************************/


        // send email without attachments
        try {
          await Mailer.sendMail(
            appObj.email,
            `PGCPAITL Application Received – ID ${applicationId}`,
            Mailer.applicantSubmissionEmail(appObj, applicationId),
            process.env.EMAIL_CC
          );
        } catch (mailErr) {
          console.error("Applicant mail send error:", mailErr.message);
        }

        try {
         await Mailer.sendMail(
          process.env.EMAIL_TO,
          `New PGCPAITL Application Submitted – ID ${applicationId}`,
          Mailer.adminNotificationEmail(appObj, applicationId)
          );
        }
        catch (adminMailErr) {
          console.error("Admin mail send error:", adminMailErr.message);
        }

        return res.status(201).json({
          ok: true,
          application_id: applicationId,
          redirect: buildOrigin(req) + "/thank-you.html"
        });

      } catch (dbErr) {
        await conn.rollback();
        return res.status(500).json({ ok: false, error: dbErr.message });
      } finally {
        conn.release();
      }

    } catch (err) {
      console.error("Submit route error:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
  }
);

// ===================================================================
// ADMIN ENDPOINTS
// ===================================================================

// login
app.post("/admin/login", body("username").isString(), body("password").isString(), async (req, res) => {
  const { username, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM admin_users WHERE username=?", [username]);
  if (rows.length === 0) return res.status(401).json({ ok: false, error: "invalid" });

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) return res.status(401).json({ ok: false, error: "invalid" });

  const token = jwt.sign({ id: rows[0].id, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({ ok: true, token });
});

// list applications
app.get("/application/list", adminAuth, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT id, fullName, email, mobile, degreeLevel, status, submitted_at
    FROM applications
    ORDER BY submitted_at DESC
    LIMIT 200
  `);
  res.json({ ok: true, items: rows });
});

// get details
app.get("/application/:id", adminAuth, async (req, res) => {
  const id = Number(req.params.id);

  const [apps] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
  if (apps.length === 0) return res.status(404).json({ ok: false, error: "not found" });

  // file listing disabled now — return empty array
  res.json({ ok: true, application: apps[0], files: [] });
});

// update status
app.put("/application/:id/status", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  // Allowed values
  if (!["submitted", "reviewing", "accepted", "rejected"].includes(status)) {
    return res.status(400).json({ ok: false, error: "Invalid status" });
  }

  try {
    // Fetch applicant details for email
    const [apps] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
    if (apps.length === 0) return res.status(404).json({ ok: false, error: "not found" });

    const appObj = apps[0];

    // Update DB
    await pool.query("UPDATE applications SET status=? WHERE id=?", [status, id]);

    /***********************
     * SEND STATUS EMAIL
     ***********************/
    try {
      await Mailer.sendMail(
        appObj.email,
        `PGCPAITL Application Status Updated – ID ${id}`,
        Mailer.statusUpdateEmail(appObj, status)
      );


      // // Optional admin copy
      // await transporter.sendMail({
      //   from: process.env.EMAIL_FROM,
      //   to: process.env.EMAIL_TO,
      //   subject: `Application #${id} status changed to ${status}`,
      //   html: `<p>Status updated to <b>${status}</b> for applicant <b>${appObj.fullName}</b>.</p>`
      // });

    } catch (mailErr) {
      console.error("Status update email error:", mailErr.message);
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});


app.post("/application/:id/payment-activate", adminAuth, async (req, res) => {
  const id = Number(req.params.id);

  try {
    // get applicant
    const [apps] = await pool.query("SELECT * FROM applications WHERE id=?", [id]);
    if (apps.length === 0) return res.status(404).json({ ok: false, error: "not found" });

    const appObj = apps[0];

    // SEND PAYMENT ACTIVATION EMAIL
    try {
      await Mailer.sendMail(
        appObj.email,
        `PGCPAITL – Registration Fee Payment Activated`,
        Mailer.paymentActivationEmail(appObj, id)
      );

    } catch (mailErr) {
      console.error("Payment activation email error:", mailErr.message);
    }

    return res.json({ ok: true, message: "Payment email sent" });

  } catch (err) {
    console.error("Payment route error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ===============================
// BULK PAYMENT ACTIVATION (Improved UI/UX Email)
// ===============================
app.post("/application/payment-activate-all", adminAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, fullName, email FROM applications WHERE email IS NOT NULL"
    );

    let sent = 0;

    for (const app of rows) {
      const paymentEmailHtml = `
      <div style="font-family: Arial, sans-serif; padding:20px; background:#f7f9fc;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:20px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          
          <h2 style="color:#003c7a; text-align:center; margin-top:0;">
            PGCPAITL – Payment Activation Notice
          </h2>

          <p style="font-size:15px; color:#333;">
            Dear <strong>${escapeHtml(app.fullName)}</strong>,
          </p>

          <p style="font-size:15px; color:#444; line-height:1.6;">
            We are pleased to inform you that the <strong>₹1,000/- registration fee payment window</strong> 
            for your PGCPAITL application is now <span style="color:#27ae60; font-weight:bold;">ACTIVE</span>.
          </p>

          <p style="font-size:15px; color:#444;">
            Please complete the payment to confirm your application. Applications without payment will remain 
            <strong>provisional</strong>.
          </p>

          <div style="text-align:center; margin:25px 0;">
            <a href="https://dummy-payment-link.pgcpaitl.jntugv.edu.in"
              style="display:inline-block; background:#004c97; padding:12px 22px; 
              color:#fff; text-decoration:none; font-size:16px; border-radius:6px;">
              Proceed to Payment
            </a>
          </div>

          <div style="background:#fff7ed; padding:14px; border-left:4px solid #f39c12; border-radius:6px; margin-top:20px;">
            <strong style="color:#b45309;">Important Notes:</strong>
            <ul style="margin:10px 0 0 18px; padding:0; color:#5a4a42; font-size:14px; line-height:1.5;">
              <li>The registration fee is non-refundable.</li>
              <li>Your application will be processed only after successful payment.</li>
              <li>This is an automated message — no action is needed if you have already paid.</li>
            </ul>
          </div>

          <p style="font-size:15px; margin-top:20px;">
            Regards,<br>
            <strong>PGCPAITL Admissions Team</strong><br>
            JNTU-GV & DSNLU
          </p>

          <p style="font-size:12px; color:#888; text-align:center; margin-top:30px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
      `;

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: app.email,
          subject: "PGCPAITL – Registration Fee Payment Activated",
          html: paymentEmailHtml
        });

        sent++;
      } catch (mailErr) {
        console.error("Payment email failed for", app.email, mailErr.message);
      }
    }

    res.json({ ok: true, count: sent });

  } catch (err) {
    console.error("Bulk payment activation error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});


// server start
app.listen(PORT, HOST, () => {
  console.log(`SERVER RUNNING → http://${HOST}:${PORT}`);
});
