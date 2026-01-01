// middleware/csrf.js
// CSRF protection using double-submit cookie pattern

const crypto = require('crypto');

// Store for CSRF tokens (use Redis in production)
const csrfTokens = new Map();

// Token expiration time (1 hour)
const TOKEN_EXPIRATION = 60 * 60 * 1000;

/**
 * Generate a CSRF token
 * @returns {string} - CSRF token
 */
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Create and store a CSRF token for a session
 * @param {string} sessionId - Session ID or user ID
 * @returns {string} - Generated CSRF token
 */
const createCSRFToken = (sessionId) => {
    const token = generateCSRFToken();

    csrfTokens.set(sessionId, {
        token,
        createdAt: new Date()
    });

    return token;
};

/**
 * Validate CSRF token
 * @param {string} sessionId - Session ID or user ID
 * @param {string} token - CSRF token to validate
 * @returns {boolean} - True if valid
 */
const validateCSRFToken = (sessionId, token) => {
    const stored = csrfTokens.get(sessionId);

    if (!stored) {
        return false;
    }

    // Check expiration
    const now = new Date();
    if (now - stored.createdAt > TOKEN_EXPIRATION) {
        csrfTokens.delete(sessionId);
        return false;
    }

    return stored.token === token;
};

/**
 * Middleware to generate CSRF token and set cookie
 */
const setCSRFToken = (req, res, next) => {
    // Skip if CSRF protection is disabled
    if (process.env.ENABLE_CSRF_PROTECTION === 'false') {
        return next();
    }

    // Get or create session identifier
    const sessionId = req.user?.id || req.sessionId || req.ip;

    // Generate CSRF token
    const csrfToken = createCSRFToken(sessionId);

    // Set CSRF token in cookie
    res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: TOKEN_EXPIRATION
    });

    // Also attach to response locals for templates
    res.locals.csrfToken = csrfToken;

    next();
};

/**
 * Middleware to verify CSRF token on state-changing requests
 */
const verifyCSRFToken = (req, res, next) => {
    // Skip if CSRF protection is disabled
    if (process.env.ENABLE_CSRF_PROTECTION === 'false') {
        return next();
    }

    // Only check on state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Get session identifier
    const sessionId = req.user?.id || req.sessionId || req.ip;

    // Get CSRF token from header or body
    const token = req.headers['x-csrf-token'] ||
        req.headers['x-xsrf-token'] ||
        req.body._csrf;

    if (!token) {
        return res.status(403).json({
            error: 'CSRF token missing',
            message: 'CSRF token is required for this request'
        });
    }

    // Validate token
    if (!validateCSRFToken(sessionId, token)) {
        return res.status(403).json({
            error: 'Invalid CSRF token',
            message: 'CSRF token validation failed'
        });
    }

    next();
};

/**
 * Endpoint to get CSRF token
 * Add this route: GET /auth/csrf-token
 */
const getCSRFTokenHandler = (req, res) => {
    const sessionId = req.user?.id || req.sessionId || req.ip;
    const csrfToken = createCSRFToken(sessionId);

    res.cookie('XSRF-TOKEN', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: TOKEN_EXPIRATION
    });

    res.json({
        csrfToken,
        expiresIn: TOKEN_EXPIRATION
    });
};

/**
 * Clean up expired tokens (run periodically)
 */
const cleanupExpiredTokens = () => {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, data] of csrfTokens.entries()) {
        if (now - data.createdAt > TOKEN_EXPIRATION) {
            csrfTokens.delete(sessionId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`✅ Cleaned up ${cleaned} expired CSRF tokens`);
    }

    return cleaned;
};

// Run cleanup every 10 minutes
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

module.exports = {
    generateCSRFToken,
    createCSRFToken,
    validateCSRFToken,
    setCSRFToken,
    verifyCSRFToken,
    getCSRFTokenHandler,
    cleanupExpiredTokens
};
