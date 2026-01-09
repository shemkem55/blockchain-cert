const jwt = require("jsonwebtoken");
const { User } = require("../config/models"); // Note: models should be chosen based on DB_TYPE, normally passed in or globally accessible.

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || (req.headers.authorization?.split(" ")[1] || null);

    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        // Special case for hardcoded root admin
        if (decoded.id === 'admin-root') {
            req.user = {
                id: 'admin-root',
                email: 'root@system',
                role: 'admin',
                username: 'root',
                isVerified: true
            };
            return next();
        }

        try {
            // we need the right Model here
            // In a better design, we'd inject the User model, but for now we rely on the implementation in models-sqlite/models-pg/models
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ error: "User no longer exists" });
            }
            if (user.isBanned) {
                return res.status(403).json({ error: "Account Suspended. Contact support." });
            }
            req.user = user;
            next();
        } catch (dbErr) {
            res.status(500).json({ error: "Authentication service error" });
        }
    });
};

const requireAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.role !== "admin" && req.user.role !== "registrar") {
            return res.status(403).json({
                error: "Administrative access required",
                userRole: req.user.role
            });
        }
        next();
    });
};

const requireStudent = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.role !== "student") {
            return res.status(403).json({ error: "Student access required" });
        }
        next();
    });
};

module.exports = { authenticateToken, requireAdmin, requireStudent };
