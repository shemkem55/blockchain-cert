// middleware/security.js
// Additional security middleware configuration

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Configure Helmet with strict security headers
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "http://localhost:*"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
});

// MongoDB NoSQL injection prevention
const sanitizeMongo = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Potential NoSQL injection attempt detected: ${key}`);
    },
});

// XSS attack prevention
const sanitizeXSS = xss();

// Function to initialize all security middleware
const initSecurity = (app) => {
    // Apply Helmet security headers
    app.use(helmetConfig);

    // Sanitize data to prevent NoSQL injection
    app.use(sanitizeMongo);

    // Sanitize data to prevent XSS attacks
    app.use(sanitizeXSS);

    // Prevent parameter pollution
    // app.use(hpp()); // Uncomment if needed
};

module.exports = {
    helmConfig,
    sanitizeMongo,
    sanitizeXSS,
    initSecurity,
};
