const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { debug, info, warn, error } = require("../config/debug");

exports.adminLogin = async (req, res) => {
    debug("Admin login attempt", req.body.username);
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query("SELECT * FROM admin_users WHERE username=?", [username]);
        if (rows.length === 0) {
            warn("Admin login failed: user not found", username);
            return res.status(401).json({ ok: false, error: "Invalid credentials" });
        }

        const valid = await bcrypt.compare(password, rows[0].password_hash);
        if (!valid) {
            warn("Admin login failed: bad password", username);
            return res.status(401).json({ ok: false, error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: rows[0].id, username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
        );

        info("Admin login success", username);
        res.json({ ok: true, token });
    } catch (err) {
        error("Admin login error", err);
        res.status(500).json({ ok: false, error: "Server error" });
    }
};

exports.ensureDefaultAdmin = async () => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS c FROM admin_users");
        if (rows[0].c === 0) {
            const user = process.env.ADMIN_DEFAULT_USER || "admin";
            const pass = process.env.ADMIN_DEFAULT_PASS || "Pgcpaitl@Jntugv";
            const hash = await bcrypt.hash(pass, 10);
            await pool.query("INSERT INTO admin_users (username,password_hash) VALUES (?,?)", [user, hash]);
            info("Default admin user created:", user);
        }
    } catch (err) {
        error("Error ensuring default admin:", err);
    }
};
