const express = require("express");
const router = express.Router();
const os = require('os');
const { requireAdmin } = require("../middleware/auth");
const { User, Certificate, ActivityLog, CertificateRequest } = require("../config/models");
const { getDB } = require("../config/db-sqlite"); // Note: fragile if DB_TYPE changes, but standard for this app's logic
const { logAudit } = require("../services/audit");

// All routes here require admin access
router.use(requireAdmin);

// System Health
router.get("/system/health", async (req, res) => {
    try {
        const health = {
            uptime: Math.floor(process.uptime()),
            memory: {
                free: os.freemem(),
                total: os.totalmem(),
                usage: (1 - (os.freemem() / os.totalmem())) * 100
            },
            cpu: os.loadavg(),
            nodeVersion: process.version,
            platform: process.platform,
            dbStatus: "CONNECTED"
        };
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Logs
router.get("/logs", async (req, res) => {
    try {
        let logs;
        if (req.user.role === "registrar") {
            logs = await ActivityLog.find({ email: req.user.email });
        } else {
            logs = await ActivityLog.find();
        }
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Users management
router.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        const enhancedUsers = users.map(u => {
            if (!u.riskScore) {
                let score = 0;
                if (!u.isVerified) score += 20;
                if (u.role === 'admin' && u.email !== 'root@system') score += 50;
                if (!u.walletAddress) score += 10;
                if (u.failedLoginAttempts > 3) score += 40;
                u.riskScore = score;
            }
            return u;
        });
        res.json({ users: enhancedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/users/:id/ban", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.email === 'root@system' || user.username === 'root') {
            return res.status(403).json({ error: "Cannot ban functionality root account" });
        }

        user.isBanned = !user.isBanned;
        if (user.isBanned) {
            user.refreshToken = null;
            user.sessionId = null;
        }

        await user.save();
        await logAudit(req, user.isBanned ? 'USER_BANNED' : 'USER_UNBANNED', { targetUser: user.email, userId: user.id });

        res.json({
            message: `User ${user.email} has been ${user.isBanned ? 'banned' : 'unbanned'}.`,
            user: { id: user.id, email: user.email, isBanned: user.isBanned }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stats
router.get("/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const users = await User.find();
        const certificates = await Certificate.find();
        const logs = await ActivityLog.find();

        const stats = {
            totalUsers,
            activeSessions: users.filter(u => u.refreshToken).length,
            totalCertificates: certificates.length,
            revokedCertificates: certificates.filter(c => c.revoked).length,
            totalLogs: logs.length,
            verificationPending: users.filter(u => !u.isVerified).length,
            securityEvents: logs.filter(l => l.action.includes('FAIL') || l.action.includes('BAN')).length
        };

        const trends = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            return {
                date: dateStr,
                users: users.filter(u => u.createdAt && (u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt).startsWith(dateStr)).length,
                certs: certificates.filter(c => c.issuedAt && (new Date(c.issuedAt).toISOString().startsWith(dateStr))).length
            };
        }).reverse();

        res.json({ stats, trends });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Requests
router.get("/requests", async (req, res) => {
    try {
        const requests = await CertificateRequest.find();
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DB Management
router.get("/db/tables", async (req, res) => {
    try {
        const db = getDB();
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
        res.json({ tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
