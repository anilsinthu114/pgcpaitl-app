const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) return res.status(401).json({ ok: false, error: "Missing Authorization Token" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, error: "Invalid or Expired Token" });
    }
};

module.exports = adminAuth;
