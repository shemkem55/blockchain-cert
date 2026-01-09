const { ActivityLog } = require("../config/models");

async function logAudit(req, action, details = {}, userId = null, email = null) {
    try {
        const log = new ActivityLog({
            userId: userId || req.user?.id,
            email: email || req.user?.email,
            action,
            details: typeof details === 'object' ? JSON.stringify(details) : details,
            ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        await log.save();
    } catch (err) {
        console.error("❌ Audit logging failed:", err.message);
    }
}

module.exports = { logAudit };
