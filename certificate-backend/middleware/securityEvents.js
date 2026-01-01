// middleware/securityEvents.js
// Security event tracking, suspicious activity detection, and account lockout

const logger = require('../utils/logger');

// Track failed login attempts per email/IP
const failedAttempts = new Map();
const ipAccessTracking = new Map();

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES) || 15; // minutes

/**
 * Security event types
 */
const SecurityEventType = {
    FAILED_LOGIN: 'FAILED_LOGIN',
    SUCCESSFUL_LOGIN: 'SUCCESSFUL_LOGIN',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    CSRF_VIOLATION: 'CSRF_VIOLATION',
    SESSION_EXPIRED: 'SESSION_EXPIRED'
};

/**
 * Log a security event
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details
 * @param {Object} req - Express request object
 */
const logSecurityEvent = (eventType, details, req = null) => {
    const event = {
        type: eventType,
        timestamp: new Date().toISOString(),
        details,
        ip: req?.ip || req?.headers['x-forwarded-for'] || 'unknown',
        userAgent: req?.headers['user-agent'] || 'unknown',
        userId: req?.user?.id || null,
        email: req?.user?.email || details.email || null
    };

    logger.warn(`[SECURITY] ${eventType}`, event);
    return event;
};

/**
 * Track failed login attempt
 * @param {string} identifier - Email or IP address
 * @returns {Object} - { attempts: number, locked: boolean, lockedUntil: Date|null }
 */
const trackFailedLogin = (identifier) => {
    const now = new Date();
    let record = failedAttempts.get(identifier);

    if (!record) {
        record = {
            attempts: 0,
            firstAttempt: now,
            lastAttempt: now,
            locked: false,
            lockedUntil: null
        };
    }

    // Check if lockout has expired
    if (record.locked && record.lockedUntil && now > record.lockedUntil) {
        record.locked = false;
        record.attempts = 0;
        record.lockedUntil = null;
    }

    // Increment attempts
    record.attempts++;
    record.lastAttempt = now;

    // Lock account if threshold exceeded
    if (record.attempts >= MAX_LOGIN_ATTEMPTS && !record.locked) {
        record.locked = true;
        record.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION * 60 * 1000);
    }

    failedAttempts.set(identifier, record);
    return record;
};

/**
 * Reset failed login attempts (on successful login)
 * @param {string} identifier - Email or IP address
 */
const resetFailedAttempts = (identifier) => {
    failedAttempts.delete(identifier);
};

/**
 * Check if account is locked
 * @param {string} identifier - Email or IP address
 * @returns {Object|null} - Lock info or null if not locked
 */
const checkAccountLock = (identifier) => {
    const record = failedAttempts.get(identifier);

    if (!record || !record.locked) {
        return null;
    }

    const now = new Date();

    // Check if lockout has expired
    if (record.lockedUntil && now > record.lockedUntil) {
        resetFailedAttempts(identifier);
        return null;
    }

    return {
        locked: true,
        lockedUntil: record.lockedUntil,
        attempts: record.attempts,
        remainingMinutes: Math.ceil((record.lockedUntil - now) / 60000)
    };
};

/**
 * Middleware to check for account lockout before login
 */
const checkLockout = (req, res, next) => {
    const identifier = req.body.email || req.ip;
    const lockInfo = checkAccountLock(identifier);

    if (lockInfo) {
        logSecurityEvent(SecurityEventType.ACCOUNT_LOCKED, {
            email: req.body.email,
            remainingMinutes: lockInfo.remainingMinutes
        }, req);

        return res.status(403).json({
            error: 'Account temporarily locked',
            message: `Too many failed login attempts. Account locked for ${lockInfo.remainingMinutes} more minutes.`,
            lockedUntil: lockInfo.lockedUntil,
            attempts: lockInfo.attempts
        });
    }

    next();
};

/**
 * Middleware to handle failed login
 */
const handleFailedLogin = (email, req) => {
    const identifier = email || req.ip;
    const record = trackFailedLogin(identifier);

    logSecurityEvent(SecurityEventType.FAILED_LOGIN, {
        email,
        attempts: record.attempts,
        locked: record.locked
    }, req);

    return {
        attempts: record.attempts,
        locked: record.locked,
        remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - record.attempts)
    };
};

/**
 * Middleware to handle successful login
 */
const handleSuccessfulLogin = (email, req) => {
    const identifier = email || req.ip;
    resetFailedAttempts(identifier);

    logSecurityEvent(SecurityEventType.SUCCESSFUL_LOGIN, {
        email
    }, req);
};

/**
 * Track IP access patterns for anomaly detection
 * @param {string} ip - IP address
 * @param {string} endpoint - Accessed endpoint
 */
const trackIPAccess = (ip, endpoint) => {
    const now = new Date();
    let record = ipAccessTracking.get(ip);

    if (!record) {
        record = {
            firstSeen: now,
            lastSeen: now,
            requestCount: 0,
            endpoints: new Set()
        };
    }

    record.lastSeen = now;
    record.requestCount++;
    record.endpoints.add(endpoint);

    ipAccessTracking.set(ip, record);

    // Detect suspicious patterns
    const timeWindow = 60000; // 1 minute
    if (now - record.firstSeen < timeWindow && record.requestCount > 100) {
        logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
            ip,
            requestCount: record.requestCount,
            timeWindow: '1 minute',
            reason: 'High request rate from single IP'
        });
    }
};

/**
 * Middleware to track IP access
 */
const trackIPMiddleware = (req, res, next) => {
    trackIPAccess(req.ip, req.path);
    next();
};

/**
 * Get security statistics
 */
const getSecurityStats = () => {
    return {
        totalLockedAccounts: Array.from(failedAttempts.values()).filter(r => r.locked).length,
        totalFailedAttempts: failedAttempts.size,
        trackedIPs: ipAccessTracking.size,
        lockedAccounts: Array.from(failedAttempts.entries())
            .filter(([_, record]) => record.locked)
            .map(([identifier, record]) => ({
                identifier,
                attempts: record.attempts,
                lockedUntil: record.lockedUntil
            }))
    };
};

/**
 * Clean up old records (run periodically)
 */
const cleanupOldRecords = () => {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleaned = 0;

    // Clean up failed attempts
    for (const [identifier, record] of failedAttempts.entries()) {
        if (!record.locked && now - record.lastAttempt > maxAge) {
            failedAttempts.delete(identifier);
            cleaned++;
        }
    }

    // Clean up IP tracking
    for (const [ip, record] of ipAccessTracking.entries()) {
        if (now - record.lastSeen > maxAge) {
            ipAccessTracking.delete(ip);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`✅ Cleaned up ${cleaned} old security records`);
    }

    return cleaned;
};

// Run cleanup every hour
setInterval(cleanupOldRecords, 60 * 60 * 1000);

module.exports = {
    SecurityEventType,
    logSecurityEvent,
    trackFailedLogin,
    resetFailedAttempts,
    checkAccountLock,
    checkLockout,
    handleFailedLogin,
    handleSuccessfulLogin,
    trackIPAccess,
    trackIPMiddleware,
    getSecurityStats,
    cleanupOldRecords,
    MAX_LOGIN_ATTEMPTS,
    LOCKOUT_DURATION
};
