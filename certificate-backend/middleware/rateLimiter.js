const rateLimit = require('express-rate-limit');

// Custom handler to ensure JSON response even if some middleware interferes
const jsonHandler = (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
};

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased for dev/testing
    message: {
        error: 'Too many authentication attempts from this IP, please try again after 15 minutes'
    },
    handler: jsonHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

// Moderate rate limiter for certificate operations
const certificateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Increased for dev
    message: {
        error: 'Too many certificate requests, please try again later'
    },
    handler: jsonHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased significantly for dev
    message: {
        error: 'Too many requests from this IP, please try again later'
    },
    handler: jsonHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict limiter for AI endpoints (computationally expensive)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // Increased for dev
    message: {
        error: 'Too many AI requests, please try again in a minute'
    },
    handler: jsonHandler,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    certificateLimiter,
    apiLimiter,
    aiLimiter,
};
