// middleware/sessionManager.js
// Session management with timeout tracking and JWT refresh tokens

const jwt = require('jsonwebtoken');

// In-memory session store (use Redis in production for distributed systems)
const activeSessions = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 30; // minutes
const JWT_EXPIRE = '15m'; // Short-lived access tokens
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d'; // Long-lived refresh tokens

/**
 * Create a new session with access and refresh tokens
 * @param {Object} user - User object with id, email, role
 * @returns {Object} - { accessToken, refreshToken, sessionId }
 */
const createSession = (user) => {
    const sessionId = require('crypto').randomBytes(32).toString('hex');

    // Create access token (short-lived)
    const accessToken = jwt.sign(
        {
            id: user.id || user._id,
            email: user.email,
            role: user.role,
            sessionId
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
    );

    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
        {
            id: user.id || user._id,
            email: user.email,
            sessionId
        },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRE }
    );

    // Store session
    activeSessions.set(sessionId, {
        userId: user.id || user._id,
        email: user.email,
        role: user.role,
        createdAt: new Date(),
        lastActivity: new Date(),
        refreshToken
    });

    return {
        accessToken,
        refreshToken,
        sessionId
    };
};

/**
 * Update session activity timestamp
 * @param {string} sessionId - Session ID to update
 */
const updateSessionActivity = (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (session) {
        session.lastActivity = new Date();
        activeSessions.set(sessionId, session);
    }
};

/**
 * Check if session has timed out
 * @param {string} sessionId - Session ID to check
 * @returns {boolean} - True if session is valid (not timed out)
 */
const isSessionValid = (sessionId) => {
    const session = activeSessions.get(sessionId);
    if (!session) {
        return false;
    }

    const now = new Date();
    const timeoutMs = SESSION_TIMEOUT * 60 * 1000;
    const timeSinceActivity = now - session.lastActivity;

    if (timeSinceActivity > timeoutMs) {
        // Session timed out, remove it
        activeSessions.delete(sessionId);
        return false;
    }

    return true;
};

/**
 * Invalidate a session (logout)
 * @param {string} sessionId - Session ID to invalidate
 */
const invalidateSession = (sessionId) => {
    activeSessions.delete(sessionId);
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object|null} - { accessToken, user } or null if invalid
 */
const refreshAccessToken = (refreshToken) => {
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const sessionId = decoded.sessionId;

        // Check if session exists and is valid
        const session = activeSessions.get(sessionId);
        if (!session || session.refreshToken !== refreshToken) {
            return null;
        }

        // Check timeout
        if (!isSessionValid(sessionId)) {
            return null;
        }

        // Update activity
        updateSessionActivity(sessionId);

        // Create new access token
        const accessToken = jwt.sign(
            {
                id: decoded.id,
                email: decoded.email,
                role: session.role,
                sessionId
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        return {
            accessToken,
            user: {
                id: decoded.id,
                email: decoded.email,
                role: session.role
            }
        };
    } catch (error) {
        console.error('Refresh token error:', error.message);
        return null;
    }
};

/**
 * Middleware to verify session and update activity
 */
const verifySession = (req, res, next) => {
    try {
        const token = req.cookies.token ||
            (req.headers.authorization?.split(' ')[1] || null);

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const sessionId = decoded.sessionId;

        // Check if session is valid
        if (!sessionId || !isSessionValid(sessionId)) {
            return res.status(401).json({
                error: 'Session expired due to inactivity',
                sessionExpired: true
            });
        }

        // Update activity timestamp
        updateSessionActivity(sessionId);

        // Attach user to request
        req.user = decoded;
        req.sessionId = sessionId;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access token expired',
                tokenExpired: true
            });
        }
        console.error('Session verification failed:', error.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Get session statistics for monitoring
 */
const getSessionStats = () => {
    return {
        totalActiveSessions: activeSessions.size,
        sessions: Array.from(activeSessions.entries()).map(([id, session]) => ({
            sessionId: id,
            userId: session.userId,
            email: session.email,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            ageMinutes: Math.floor((new Date() - session.createdAt) / 60000),
            idleMinutes: Math.floor((new Date() - session.lastActivity) / 60000)
        }))
    };
};

/**
 * Clean up expired sessions (run periodically)
 */
const cleanupExpiredSessions = () => {
    const now = new Date();
    const timeoutMs = SESSION_TIMEOUT * 60 * 1000;
    let cleaned = 0;

    for (const [sessionId, session] of activeSessions.entries()) {
        const timeSinceActivity = now - session.lastActivity;
        if (timeSinceActivity > timeoutMs) {
            activeSessions.delete(sessionId);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        console.log(`✅ Cleaned up ${cleaned} expired sessions`);
    }

    return cleaned;
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

module.exports = {
    createSession,
    updateSessionActivity,
    isSessionValid,
    invalidateSession,
    refreshAccessToken,
    verifySession,
    getSessionStats,
    cleanupExpiredSessions,
    SESSION_TIMEOUT,
    JWT_EXPIRE,
    JWT_REFRESH_EXPIRE
};
