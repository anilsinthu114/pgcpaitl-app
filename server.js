/*******************************
 * server.js
 * MySQL-only backend for updated PGCPAITL form
 *******************************/
require('dotenv').config();
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
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const PORT = parseInt(process.env.PORT || '4000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const FILE_BASE = process.env.FILE_BASE || path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
const ALLOWED_MIMES = (process.env.ALLOWED_MIMES || 'application/pdf,image/jpeg,image/png,image/jpg').split(',');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// --- MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// ensure uploads dir exists
fsSync.mkdirSync(FILE_BASE, { recursive: true });

// nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_SECURE === 'true'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// multer memory storage & filter
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

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60*1000, max: 120 }));

app.set('trust proxy', 'loopback');

// If behind real domain NGINX:
app.set('trust proxy', 1);
// serve static public (index.html and form-submit.js)
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Utility functions ----------
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,"&#039;"); }
function buildOrigin(req){
  const proto = req.get('x-forwarded-proto') || req.protocol;
  return `${proto}://${req.get('host')}`;
}

// ---------- Admin helper (create default admin if none) ----------
async function ensureDefaultAdmin(){
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM admin_users');
  if (rows[0].c === 0) {
    const user = process.env.ADMIN_DEFAULT_USER || 'admin';
    const pass = process.env.ADMIN_DEFAULT_PASS || 'Admin@1234';
    const hash = await bcrypt.hash(pass, 10);
    await pool.query('INSERT INTO admin_users (username,password_hash) VALUES (?,?)', [user, hash]);
    console.log('Default admin created:', user);
  }
}
ensureDefaultAdmin().catch(console.error);

// ---------- Admin auth ----------
function adminAuth(req, res, next){
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ ok:false, error:'no auth' });
  const [scheme, token] = h.split(' ');
  if (scheme !== 'Bearer') return res.status(401).json({ ok:false, error:'bad auth' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch(e) {
    return res.status(401).json({ ok:false, error:'invalid token' });
  }
}

// ---------- Helper: insert application (MySQL) ----------
async function insertApplication(conn, appObj) {
  const sql = `INSERT INTO applications
    (fullName,parentName,dob,gender,category,nationality,aadhaar,mobile,whatsapp,email,address,city,district,state,pin,country,
     degreeLevel,specialization,university,passingYear,studyMode,percentage,employmentStatus,organisation,designation,sector,experience,
     sop,commMode,declarations,submitted_at,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),?)`;
  const commModeStr = Array.isArray(appObj.commMode) ? appObj.commMode.join(',') : (appObj.commMode || null);
  const declarationsStr = Array.isArray(appObj.declaration) ? JSON.stringify(appObj.declaration) : JSON.stringify([]);
  const params = [
    appObj.fullName, appObj.parentName, appObj.dob, appObj.gender, appObj.category, appObj.nationality, appObj.aadhaar || null,
    appObj.mobile, appObj.whatsapp || null, appObj.email, appObj.address, appObj.city, appObj.district, appObj.state, appObj.pin, appObj.country,
    appObj.degreeLevel, appObj.specialization, appObj.university, appObj.passingYear ? parseInt(appObj.passingYear,10) : null,
    appObj.studyMode, appObj.percentage || null, appObj.employmentStatus || null, appObj.organisation || null, appObj.designation || null,
    appObj.sector || null, appObj.experience || null, appObj.sop, commModeStr, declarationsStr, 'submitted'
  ];
  const [res] = await conn.query(sql, params);
  return res.insertId;
}

// ---------- Multer fields (match your HTML) ----------
const multerMiddleware = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'degreeCert', maxCount: 1 },
  { name: 'marksheets', maxCount: 1 },
  { name: 'supportDocs', maxCount: 10 }
]);

// ---------- Routes ----------

// health
app.get('/health', (req, res) => res.json({ ok:true }));

// admin login
app.post(
  '/admin/login',
  body('username').isString(),
  body('password').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ ok: false, error: 'Invalid input' });
    }

    const { username, password } = req.body;
    console.log('Admin login attempt:', username);
    try {
      const [rows] = await pool.query('SELECT * FROM admin_users WHERE username=?', [username]);
      if (rows.length === 0) {
        return res.status(401).json({ ok: false, error: 'Invalid credentials' });
      }

      const user = rows[0];
      console.log('User found:', user.username);
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ ok: false, error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );

      res.json({ ok: true, token });
      console.log('Admin login successful:', username);
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: 'Server error' });
    }
  }
);

// application submit (match new form)
app.post('/application/submit',
  multerMiddleware,
  // basic validation for required fields as per HTML
  body('fullName').notEmpty(),
  body('parentName').notEmpty(),
  body('dob').notEmpty(),
  body('gender').notEmpty(),
  body('category').notEmpty(),
  body('nationality').notEmpty(),
  body('mobile').notEmpty(),
  body('email').isEmail(),
  body('address').notEmpty(),
  body('city').notEmpty(),
  body('district').notEmpty(),
  body('state').notEmpty(),
  body('pin').notEmpty(),
  body('country').notEmpty(),
  body('degreeLevel').notEmpty(),
  body('specialization').notEmpty(),
  body('university').notEmpty(),
  body('passingYear').notEmpty(),
  body('studyMode').notEmpty(),
  body('percentage').notEmpty(),
  body('sop').notEmpty(),
  async (req, res) => {
    try {
      // show debug logs (temporary)
      console.log('REQ.BODY keys:', Object.keys(req.body));
      if (req.files) {
        Object.entries(req.files).forEach(([k,v]) => console.log('FILES', k, 'count=', v.length));
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ ok:false, errors: errors.array() });
      }

      const data = req.body;
      // normalize arrays: declaration[], commMode may come as multiple fields
      // depending on client they may appear as "declaration[]" or "declaration"
      const declarations = data['declaration[]'] || data.declaration || [];
      const commMode = [].concat(data['commMode'] || data.commMode || []);

      // create transaction
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const appObj = {
          fullName: data.fullName,
          parentName: data.parentName,
          dob: data.dob,
          gender: data.gender,
          category: data.category,
          nationality: data.nationality,
          aadhaar: data.aadhaar || null,
          mobile: data.mobile,
          whatsapp: data.whatsapp || null,
          email: data.email,
          address: data.address,
          city: data.city,
          district: data.district,
          state: data.state,
          pin: data.pin,
          country: data.country,
          degreeLevel: data.degreeLevel,
          specialization: data.specialization,
          university: data.university,
          passingYear: data.passingYear,
          studyMode: data.studyMode,
          percentage: data.percentage,
          employmentStatus: data.employmentStatus || null,
          organisation: data.organisation || null,
          designation: data.designation || null,
          sector: data.sector || null,
          experience: data.experience || null,
          sop: data.sop,
          commMode: commMode,
          declaration: Array.isArray(declarations) ? declarations : [declarations]
        };

        const applicationId = await insertApplication(conn, appObj);

        // store files from req.files
        const fileTypesMap = {
          photo: 'photo',
          idProof: 'id_proof',
          degreeCert: 'degree_certificate',
          marksheets: 'marksheets',
          supportDocs: 'support_docs'
        };

        const savedFiles = []; // for email attachments

        for (const fieldName of Object.keys(fileTypesMap)) {
          const files = req.files?.[fieldName];
          if (!files) continue;
          const dir = path.join(FILE_BASE, 'applications', String(applicationId));
          await fs.mkdir(dir, { recursive: true });
          for (const f of files) {
            const ext = path.extname(f.originalname) || '';
            const safeName = `${fileTypesMap[fieldName]}_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`;
            const storedPath = path.join(dir, safeName);
            await fs.writeFile(storedPath, f.buffer, { mode: 0o640 });
            await conn.query(
              `INSERT INTO application_files (application_id, type, original_name, stored_name, stored_path, mime, size_bytes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
               [applicationId, fileTypesMap[fieldName], f.originalname, safeName, storedPath, f.mimetype, f.size]
            );
            savedFiles.push({ path: storedPath, filename: f.originalname, contentType: f.mimetype });
          }
        }

        await conn.commit();

        // send email (with attachments)
        try {
          const html = `
            <h3>New Application #${applicationId}</h3>
            <p><b>Name:</b> ${escapeHtml(appObj.fullName)}</p>
            <p><b>Email:</b> ${escapeHtml(appObj.email)}</p>
            <p><b>Mobile:</b> ${escapeHtml(appObj.mobile)}</p>
            <p><b>Qualification:</b> ${escapeHtml(appObj.degreeLevel)} – ${escapeHtml(appObj.university)}</p>
            <p><b>Declarations:</b> ${JSON.stringify(appObj.declaration)}</p>
          `;
          await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: data.email,
            cc: process.env.EMAIL_CC,
            subject: `PGCPAITL Application #${applicationId} — ${appObj.fullName}`,
            html,
            attachments: savedFiles // nodemailer will attach files by path
          });
        } catch (mailErr) {
          console.error('Email send failed:', mailErr?.message || mailErr);
        }

        const origin = buildOrigin(req);
        return res.status(201).json({ ok:true, application_id: applicationId, redirect: origin + '/thank-you.html' });
      } catch (err) {
        await conn.rollback().catch(()=>{});
        console.error('DB transaction error:', err);
        return res.status(500).json({ ok:false, error: err.message });
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('Submit route error:', err);
      return res.status(500).json({ ok:false, error: err.message });
    }
  }
);

// Admin endpoints (example: list, get)
app.get('/application/list', adminAuth, async (req,res) => {
  const [rows] = await pool.query('SELECT id, fullName, email, mobile, degreeLevel, status, submitted_at FROM applications ORDER BY submitted_at DESC LIMIT 200');
  res.json({ ok:true, items: rows });
});

app.get('/application/:id', adminAuth, async (req,res) => {
  const id = Number(req.params.id);
  const [apps] = await pool.query('SELECT * FROM applications WHERE id=?', [id]);
  if (apps.length === 0) return res.status(404).json({ ok:false, error:'not found' });
  const [files] = await pool.query('SELECT id,type,original_name,mime,size_bytes,uploaded_at FROM application_files WHERE application_id=?', [id]);
  res.json({ ok:true, application: apps[0], files });
});

app.put('/application/:id/status', adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!["submitted", "reviewed", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ ok: false, error: "Invalid status" });
  }

  await pool.query("UPDATE applications SET status=? WHERE id=?", [status, id]);
  return res.json({ ok: true });
});

app.get('/application/file/:fileId', adminAuth, async (req,res) => {
  const fileId = Number(req.params.fileId);
  const [rows] = await pool.query('SELECT * FROM application_files WHERE id=?', [fileId]);
  if (rows.length === 0) return res.status(404).send('not found');
  const f = rows[0];
  res.setHeader('Content-Type', f.mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(f.original_name)}"`);
  return res.sendFile(path.resolve(f.stored_path));
});

// Serve dashboard only for authenticated admins
app.get('/admin/dashboard', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));
