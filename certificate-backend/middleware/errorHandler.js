// middleware/errorHandler.js
// Centralized error handling middleware

const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    if (typeof err?.message === 'string' && err.message.startsWith('CORS blocked for origin:')) {
        err.statusCode = 403;
        err.status = 'fail';
        err.isOperational = true;
    }

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error
    if (err.statusCode === 500) {
        logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
        if (err.stack) {
            logger.error(err.stack);
        }
    } else {
        logger.warn(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    }

    // Send response based on environment
    if (process.env.NODE_ENV === 'production') {
        // Production: Send minimal error details
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                error: err.message
            });
        } else {
            // Programming or unknown error: don't leak error details
            logger.error('CRITICAL ERROR:', err);
            res.status(500).json({
                status: 'error',
                error: 'Something went wrong'
            });
        }
    } else {
        // Development: Send full error details
        res.status(err.statusCode).json({
            status: err.status,
            error: err.message,
            stack: err.stack,
            details: err
        });
    }
};

// 404 handler
const notFound = (req, res, next) => {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
    next(error);
};

// Async error catcher
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    AppError,
    errorHandler,
    notFound,
    catchAsync
};
