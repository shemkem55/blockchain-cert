// utils/encryption.js
// Field-level encryption for sensitive data using AES-256-GCM

const crypto = require('crypto');

// Algorithm and configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derive encryption key from environment variable
 * @returns {Buffer} - Derived key
 */
const getEncryptionKey = () => {
    const secret = process.env.ENCRYPTION_KEY;

    if (!secret) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Convert hex string to buffer
    if (secret.length === 64) {
        return Buffer.from(secret, 'hex');
    }

    // If not hex, derive key using PBKDF2
    const salt = Buffer.from('blockchain-cert-system-salt'); // Fixed salt for consistent key derivation
    return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha512');
};

/**
 * Encrypt a string value
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in format: iv:encrypted:tag (all hex)
 */
const encrypt = (text) => {
    if (!text || typeof text !== 'string') {
        return text;
    }

    try {
        const key = getEncryptionKey();

        // Generate random IV
        const iv = crypto.randomBytes(IV_LENGTH);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag
        const tag = cipher.getAuthTag();

        // Return format: iv:encrypted:tag (all hex)
        return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
    } catch (error) {
        console.error('Encryption error:', error.message);
        throw new Error('Failed to encrypt data');
    }
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Encrypted text in format: iv:encrypted:tag
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
    if (!encryptedText || typeof encryptedText !== 'string') {
        return encryptedText;
    }

    // Check if text is encrypted (contains colons)
    if (!encryptedText.includes(':')) {
        // Not encrypted, return as is (for migration scenarios)
        return encryptedText;
    }

    try {
        const key = getEncryptionKey();

        // Split encrypted data
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const tag = Buffer.from(parts[2], 'hex');

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        // Decrypt
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error.message);
        throw new Error('Failed to decrypt data');
    }
};

/**
 * Check if a value is encrypted
 * @param {string} value - Value to check
 * @returns {boolean} - True if encrypted
 */
const isEncrypted = (value) => {
    if (!value || typeof value !== 'string') {
        return false;
    }

    const parts = value.split(':');
    return parts.length === 3 &&
        parts[0].length === IV_LENGTH * 2 &&  // IV in hex
        parts[2].length === TAG_LENGTH * 2;    // Tag in hex
};

/**
 * Generate a secure encryption key (for environment setup)
 * @returns {string} - Random 32-byte key as hex string
 */
const generateEncryptionKey = () => {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

/**
 * Encrypt object fields
 * @param {Object} obj - Object with fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Object} - Object with encrypted fields
 */
const encryptFields = (obj, fields) => {
    const result = { ...obj };

    for (const field of fields) {
        if (result[field]) {
            result[field] = encrypt(result[field]);
        }
    }

    return result;
};

/**
 * Decrypt object fields
 * @param {Object} obj - Object with encrypted fields
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Object} - Object with decrypted fields
 */
const decryptFields = (obj, fields) => {
    const result = { ...obj };

    for (const field of fields) {
        if (result[field] && isEncrypted(result[field])) {
            try {
                result[field] = decrypt(result[field]);
            } catch (error) {
                console.error(`Failed to decrypt field ${field}:`, error.message);
                // Keep encrypted value if decryption fails
            }
        }
    }

    return result;
};

/**
 * Hash a value (one-way, for comparison)
 * @param {string} value - Value to hash
 * @returns {string} - SHA-256 hash
 */
const hash = (value) => {
    return crypto.createHash('sha256').update(value).digest('hex');
};

/**
 * Verify if value matches hash
 * @param {string} value - Value to check
 * @param {string} hashedValue - Hash to compare against
 * @returns {boolean} - True if matches
 */
const verifyHash = (value, hashedValue) => {
    return hash(value) === hashedValue;
};

module.exports = {
    encrypt,
    decrypt,
    isEncrypted,
    generateEncryptionKey,
    encryptFields,
    decryptFields,
    hash,
    verifyHash,
    ALGORITHM,
    KEY_LENGTH
};
