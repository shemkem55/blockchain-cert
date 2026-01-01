// middleware/passwordPolicy.js
// Strong password validation and security policies

const validator = require('validator');

// Common weak passwords to block
const COMMON_PASSWORDS = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321'
];

/**
 * Validate password strength according to security policy
 * @param {string} password - Password to validate
 * @returns {Object} - { valid: boolean, errors: string[], score: number }
 */
const validatePasswordStrength = (password) => {
    const errors = [];
    let score = 0;

    // Check minimum length
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 8;
    if (!password || password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    } else {
        score += 20;
    }

    // Check for uppercase letters
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else {
        score += 20;
    }

    // Check for lowercase letters
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else {
        score += 20;
    }

    // Check for numbers
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    } else {
        score += 20;
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
    } else {
        score += 20;
    }

    // Check against common passwords
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('This password is too common. Please choose a more unique password');
        score = Math.max(0, score - 40);
    }

    // Bonus points for extra length
    if (password.length >= 12) {
        score += 10;
    }
    if (password.length >= 16) {
        score += 10;
    }

    return {
        valid: errors.length === 0,
        errors,
        score: Math.min(100, score)
    };
};

/**
 * Express middleware to validate password strength
 * Use this in registration and password change routes
 */
const requireStrongPassword = (req, res, next) => {
    // Skip validation if strong passwords not required
    if (process.env.REQUIRE_STRONG_PASSWORD === 'false') {
        return next();
    }

    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            error: 'Password is required',
            validationErrors: ['Password field is missing']
        });
    }

    const validation = validatePasswordStrength(password);

    if (!validation.valid) {
        return res.status(400).json({
            error: 'Password does not meet security requirements',
            validationErrors: validation.errors,
            passwordStrength: validation.score
        });
    }

    // Attach validation result to request for logging
    req.passwordValidation = validation;
    next();
};

/**
 * Check if password has been used before (to prevent reuse)
 * @param {string} newPassword - New password to check
 * @param {Array} passwordHistory - Array of previous password hashes
 * @returns {Promise<boolean>} - True if password has been used before
 */
const isPasswordReused = async (newPassword, passwordHistory = []) => {
    const bcrypt = require('bcryptjs');

    // Check against previous passwords
    for (const oldHash of passwordHistory) {
        const isMatch = await bcrypt.compare(newPassword, oldHash);
        if (isMatch) {
            return true;
        }
    }

    return false;
};

/**
 * Middleware to check password reuse
 * Requires user object in req.user
 */
const checkPasswordReuse = async (req, res, next) => {
    try {
        const { password } = req.body;
        const user = req.user;

        if (!user || !user.passwordHistory) {
            return next();
        }

        const reused = await isPasswordReused(password, user.passwordHistory);

        if (reused) {
            return res.status(400).json({
                error: 'Password has been used before',
                validationErrors: ['Please choose a password you have not used previously']
            });
        }

        next();
    } catch (error) {
        console.error('Error checking password reuse:', error);
        next(); // Don't block on error, just log it
    }
};

/**
 * Get password strength score for display purposes
 */
const getPasswordStrength = (password) => {
    const validation = validatePasswordStrength(password);
    return {
        score: validation.score,
        level: validation.score >= 80 ? 'strong' :
            validation.score >= 60 ? 'moderate' :
                validation.score >= 40 ? 'weak' : 'very weak',
        valid: validation.valid,
        errors: validation.errors
    };
};

module.exports = {
    validatePasswordStrength,
    requireStrongPassword,
    isPasswordReused,
    checkPasswordReuse,
    getPasswordStrength,
    COMMON_PASSWORDS
};
