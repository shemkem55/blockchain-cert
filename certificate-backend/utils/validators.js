const { body, param } = require("express-validator");

const validateEmail = body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email");

const validatePassword = body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters");

const validateName = body("name")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name must contain only alphabetic characters");

const validateCourse = body("course")
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Course must be a valid string");

const validateYear = body("year")
    .isInt({ min: 1900, max: new Date().getFullYear() + 10 })
    .withMessage("Year must be a valid numeric value");

const validateCertId = param("id")
    .matches(/^[a-f0-9]{10}$/)
    .withMessage("Certificate ID must be a 10-character hexadecimal hash");

const validateBodyCertId = body("id")
    .matches(/^[a-f0-9]{10}$/)
    .withMessage("Certificate ID must be a 10-character hexadecimal hash");

module.exports = {
    validateEmail,
    validatePassword,
    validateName,
    validateCourse,
    validateYear,
    validateCertId,
    validateBodyCertId
};
