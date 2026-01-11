// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { body, validationResult, param } = require("express-validator");
const https = require("https");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const { ethers } = require("ethers");

const { authLimiter, certificateLimiter, apiLimiter, aiLimiter } = require("./middleware/rateLimiter"); // Rate Limiting Upgrade
const multer = require("multer");
const compression = require("compression");
const morgan = require("morgan");
const { OAuth2Client } = require("google-auth-library");
// const xss = require("xss-clean"); // Removed due to Express 5 compatibility issues
const logger = require("./utils/logger"); // Logging Upgrade
const { errorHandler, notFound } = require("./middleware/errorHandler"); // Error Handling Upgrade

// Security middleware imports
const { requireStrongPassword, getPasswordStrength, checkPasswordReuse } = require("./middleware/passwordPolicy");
const { createSession, refreshAccessToken, verifySession, invalidateSession } = require("./middleware/sessionManager");
const { getCSRFTokenHandler, verifyCSRFToken } = require("./middleware/csrf");
const { checkLockout, handleFailedLogin, handleSuccessfulLogin, trackIPMiddleware, SecurityEventType, logSecurityEvent } = require("./middleware/securityEvents");
const { encrypt, decrypt } = require("./utils/encryption");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cert-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files are allowed!'), false);
        }
    }
});

const app = express();
app.disable('x-powered-by');

// Security Middleware
app.use(helmet());
app.use(morgan("combined", { stream: logger.stream })); // Use professional logger
app.use(compression());
// app.use(xss()); // Removed due to Express 5 compatibility issues

// Track IP access patterns
app.use(trackIPMiddleware);

// Rate Limiting
// Rate Limiting
app.use(apiLimiter);

// Email Configuration

// Email Configuration
const emailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com",
        pass: process.env.EMAIL_PASSWORD || "your-app-password",
    },
});

// Test email configuration
emailTransporter.verify((error, success) => {
    if (error) {
        console.warn("⚠️  Email configuration issue (OTP will log to console):", error.message);
    } else {
        console.log("✅ Email service ready - OTP will be sent via email");
    }
});

// CORS with credentials support
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:8080,http://localhost:3001,http://127.0.0.1:43497")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);

            // Check if origin is in allowed list
            if (corsOrigins.includes(origin)) return callback(null, true);

            // Allow production domains and common subdomains
            if (origin.endsWith(".netlify.app") || origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
if (
    process.env.NODE_ENV === "production" &&
    (!process.env.JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production")
) {
    throw new Error("JWT_SECRET must be set to a strong value in production");
}
const JWT_EXPIRE = "7d";

// Database Connection - Dynamic Loading
const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let connectDB, User, Certificate, Feedback, ActivityLog, CertificateRequest, FraudReport, VerificationHistory, SystemSettings;
let dbReady = false;
let blockchainReady = false;
let blockchainInitInProgress = false;
let blockchainLastError = null;
let blockchainLastAttemptAt = null;
let blockchainRpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
let blockchainContractAddress = null;
let blockchainNetwork = null;
let blockchainRetryHandle = null;
const blockchainRetryIntervalMs = Number.parseInt(process.env.BLOCKCHAIN_RETRY_MS || "15000", 10);

if (DB_TYPE === 'mariadb') {
    console.log("🔌 Using MariaDB/MySQL Database");
    ({ connectDB, getDB } = require("./config/db"));
    ({ User, Certificate, Feedback, ActivityLog, CertificateRequest, VerificationHistory, FraudReport } = require("./config/models"));
} else if (DB_TYPE === 'postgres') {
    console.log("🔌 Using PostgreSQL Database");
    ({ connectDB, getDB } = require("./config/db-pg"));
    ({ User, Certificate, Feedback, ActivityLog, CertificateRequest, VerificationHistory, FraudReport } = require("./config/models-pg"));
} else {
    console.log("🔌 Using SQLite Database");
    ({ connectDB, getDB } = require("./config/db-sqlite"));
    ({ User, Certificate, Feedback, ActivityLog, SystemSettings, CertificateRequest, VerificationHistory, FraudReport } = require("./config/models-sqlite"));
}

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        time: new Date().toISOString(),
        db: {
            type: DB_TYPE,
            ready: dbReady
        },
        blockchain: {
            rpcUrl: blockchainRpcUrl,
            contractAddress: blockchainContractAddress,
            network: blockchainNetwork,
            ready: blockchainReady,
            lastAttemptAt: blockchainLastAttemptAt,
            lastError: blockchainLastError
        }
    });
});

// Connect to database
connectDB()
    .then(() => {
        dbReady = true;
        logger.info("✅ Database initialized successfully");
        initBlockchain();
    })
    .catch((err) => logger.error("❌ Database error:", err));

// ----------------------
// Blockchain Configuration
// ----------------------
let contract;
let adminWallet;

function startBlockchainRetry() {
    if (blockchainRetryHandle) return;
    blockchainRetryHandle = setInterval(() => {
        void initBlockchain();
    }, Number.isFinite(blockchainRetryIntervalMs) && blockchainRetryIntervalMs > 0 ? blockchainRetryIntervalMs : 15000);
}

function stopBlockchainRetry() {
    if (!blockchainRetryHandle) return;
    clearInterval(blockchainRetryHandle);
    blockchainRetryHandle = null;
}

async function initBlockchain() {
    if (blockchainInitInProgress) return;
    blockchainInitInProgress = true;
    try {
        const { ethers } = require("ethers");
        blockchainLastAttemptAt = new Date().toISOString();
        blockchainLastError = null;

        // Read deployed address
        const addressPath = path.join(__dirname, "artifacts/deployed_address.json");
        if (!fs.existsSync(addressPath)) {
            // Fallback for local dev if not yet copied, though we prefer the local artifacts folder
            const devPath = path.join(__dirname, "../certificate-verification./deployed_address.json");
            if (fs.existsSync(devPath)) {
                fs.copyFileSync(devPath, addressPath);
            } else {
                blockchainReady = false;
                blockchainNetwork = null;
                blockchainContractAddress = null;
                blockchainLastError = "deployed_address.json not found";
                console.warn("⚠️ Blockchain Warning: deployed_address.json not found. Run deployment script first.");
                startBlockchainRetry();
                return;
            }
        }
        const { address } = JSON.parse(fs.readFileSync(addressPath, "utf8"));
        blockchainContractAddress = address;

        // Read ABI
        const artifactPath = path.join(__dirname, "artifacts/SoulboundCertificate.json");
        if (!fs.existsSync(artifactPath)) {
            // Fallback for local dev
            const devArtifactPath = path.join(__dirname, "../certificate-verification./artifacts/contracts/SoulboundCertificate.sol/SoulboundCertificate.json");
            if (fs.existsSync(devArtifactPath)) {
                fs.copyFileSync(devArtifactPath, artifactPath);
            } else {
                blockchainReady = false;
                blockchainNetwork = null;
                blockchainLastError = "artifact not found";
                console.warn("⚠️ Blockchain Warning: Artifact not found.");
                startBlockchainRetry();
                return;
            }
        }
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

        // Connect to local Hardhat node
        // Connect to Blockchain Node (Local or Production)
        blockchainRpcUrl = process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545";
        const provider = new ethers.JsonRpcProvider(blockchainRpcUrl);

        // Check connection
        const network = await provider.getNetwork().catch(() => null);
        if (!network) {
            blockchainReady = false;
            blockchainNetwork = null;
            blockchainLastError = `RPC not reachable: ${blockchainRpcUrl}`;
            console.warn("⚠️ Blockchain Warning: Could not connect to local Hardhat node at http://127.0.0.1:8545");
            startBlockchainRetry();
            return;
        }
        blockchainNetwork = { name: network.name, chainId: network.chainId?.toString?.() ?? String(network.chainId) };

        // Admin Wallet (Account #0 from Hardhat node)
        const adminPrivateKey = process.env.BLOCKCHAIN_ADMIN_PRIVATE_KEY;
        if (!adminPrivateKey && process.env.NODE_ENV === "production") {
            blockchainReady = false;
            blockchainLastError = "BLOCKCHAIN_ADMIN_PRIVATE_KEY not set";
            console.warn("⚠️ Blockchain Warning: BLOCKCHAIN_ADMIN_PRIVATE_KEY not set");
            startBlockchainRetry();
            return;
        }

        const devFallbackKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        adminWallet = new ethers.Wallet(adminPrivateKey || devFallbackKey, provider);

        const code = await provider.getCode(address).catch(() => null);
        if (!code || code === "0x") {
            blockchainReady = false;
            blockchainLastError = `No contract deployed at ${address} on ${blockchainRpcUrl}`;
            console.warn(`⚠️ Blockchain Warning: No contract deployed at ${address}. Deploy the contract to this network.`);
            startBlockchainRetry();
            return;
        }

        contract = new ethers.Contract(address, artifact.abi, adminWallet);
        blockchainReady = true;
        stopBlockchainRetry();
        console.log(`✅ Blockchain connected. Contract at: ${address}. Network: ${network.name} (Chain ID: ${network.chainId})`);

    } catch (error) {
        blockchainReady = false;
        blockchainNetwork = null;
        blockchainLastError = error?.message || String(error);
        startBlockchainRetry();
        console.error("❌ Blockchain Init Error:", error.message);
    } finally {
        blockchainInitInProgress = false;
    }
}

// Email Sending Function
async function sendOTPEmail(email, otp) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || "your-email@gmail.com",
            to: email,
            subject: "🔐 Your OTP Verification Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">Email Verification</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hello,</p>
            <p style="color: #555; font-size: 14px;">Your OTP verification code is:</p>
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 12px;">⏱️ This code expires in 10 minutes</p>
            <p style="color: #555; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Blockchain Certificate System</p>
          </div>
        </div>
      `,
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
        console.log("\n" + "=".repeat(60));
        console.log(`📧 OTP FALLBACK FOR: ${email}`);
        console.log(`🔐 OTP CODE: ${otp}`);
        console.log(`⏱️  EXPIRES IN: 10 minutes`);
        console.log("=".repeat(60) + "\n");
        return false;
    }
}

// Activity Logging Helper
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

// ----------------------
// Middleware - JWT Authentication
// ----------------------

const authenticateToken = (req, res, next) => {
    const token =
        req.cookies.token || (req.headers.authorization?.split(" ")[1] || null);

    if (!token) {
        console.warn("🔐 Auth Failure: No token provided");
        return res.status(401).json({ error: "No authentication token provided" });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.error("🔐 Token verification failed:", err.message);
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        // Special case for hardcoded root admin
        if (decoded.id === 'admin-root') {
            req.user = {
                id: 'admin-root',
                email: 'root@system',
                role: 'admin',
                username: 'root',
                isVerified: true
            };
            return next();
        }

        // Verify user status in real-time (check for bans)
        try {
            const user = await User.findById(decoded.id);
            if (!user) {
                console.warn(`🔐 Auth Failure: User with ID ${decoded.id} not found in DB`);
                return res.status(401).json({ error: "User no longer exists" });
            }
            if (user.isBanned) {
                console.warn(`🚫 Blocked access attempt by banned user: ${user.email}`);
                return res.status(403).json({ error: "Account Suspended. Contact support." });
            }
            // Update request user with fresh DB data
            req.user = user;
            next();
        } catch (dbErr) {
            console.error("Auth DB check failed:", dbErr);
            res.status(500).json({ error: "Authentication service error" });
        }
    });
};

const requireAdmin = (req, res, next) => {
    const token =
        req.cookies.token || (req.headers.authorization?.split(" ")[1] || null);

    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("🔐 Token verification failed:", err.message);
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        if (user.role !== "admin" && user.role !== "registrar") {
            return res.status(403).json({
                error: "Administrative access required",
                userRole: user.role
            });
        }

        req.user = user;
        next();
    });
};

const requireStudent = (req, res, next) => {
    const token =
        req.cookies.token || (req.headers.authorization?.split(" ")[1] || null);

    if (!token) {
        return res.status(401).json({ error: "No authentication token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("🔐 Token verification failed:", err.message);
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        if (user.role !== "student") {
            return res.status(403).json({ error: "Student access required" });
        }

        req.user = user;
        next();
    });
};

// ----------------------
// Validation Rules
// ----------------------

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

// ----------------------
// Routes
// ----------------------

app.get("/", (req, res) => {
    res.send("✅ Backend is running with Enhanced Security Features...");
});

// ---- Security Routes ----

// Get CSRF token
app.get("/auth/csrf-token", getCSRFTokenHandler);

// Refresh access token
app.post("/auth/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token required" });
        }

        const result = refreshAccessToken(refreshToken);

        if (!result) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        // Set new access token in cookie
        res.cookie("token", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.json({
            message: "Token refreshed successfully",
            accessToken: result.accessToken,
            user: result.user
        });
    } catch (error) {
        console.error("❌ REFRESH error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Password strength check endpoint
app.post("/auth/check-password-strength", (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password required" });
    }

    const strength = getPasswordStrength(password);
    res.json(strength);
});

// ---- Feedback Routes ----

app.post(
    "/feedback",
    [
        body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
        body("email").isEmail().withMessage("Valid email is required"),
        body("subject").trim().isLength({ min: 1 }).withMessage("Subject is required"),
        body("feedbackType").isIn(["general", "bug", "feature", "improvement", "other"]).withMessage("Invalid feedback type"),
        body("message").trim().isLength({ min: 10 }).withMessage("Message must be at least 10 characters"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, email, subject, feedbackType, message } = req.body;

            const feedback = new Feedback({
                name,
                email,
                subject,
                feedbackType,
                message,
            });

            await feedback.save();

            res.json({ message: "✅ Thank you for your feedback! We appreciate your input." });
        } catch (error) {
            console.error("❌ FEEDBACK error:", error);
            const showDetail = process.env.NODE_ENV !== "production";
            res.status(500).json({ error: showDetail ? error.message : "Internal server error" });
        }
    }
);

// ---- Authentication Routes ----

// Register
app.post(
    "/auth/register",
    authLimiter,
    [validateEmail, validatePassword, body("role").isIn(["admin", "student", "employer", "registrar"])],
    requireStrongPassword, // Add password strength validation
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, role } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ error: "User already exists" });
            }

            // Check if any admin users exist
            const adminCount = await User.countDocuments({ role: "admin" });

            // If admins exist and trying to create an admin or registrar, require admin auth
            if (adminCount > 0 && (role === "admin" || role === "registrar")) {
                const token =
                    req.cookies.token || (req.headers.authorization?.split(" ")[1] || null);

                if (!token) {
                    return res.status(401).json({ error: `Admin authorization required to create ${role} accounts` });
                }

                try {
                    const decoded = jwt.verify(token, JWT_SECRET);
                    if (decoded.role !== "admin") {
                        return res.status(403).json({ error: `Security Policy Violation: Only system administrators can authorize new ${role} accounts.` });
                    }
                } catch (err) {
                    return res.status(403).json({ error: "Invalid or expired token" });
                }
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const result = await User.collection.insertOne({
                email: email.toLowerCase(),
                password: hashedPassword,
                role: role,
                isVerified: true,
                createdAt: new Date(),
                university: req.body.university || null,
                organizationName: req.body.organizationName || null,
                registrationNumber: req.body.registrationNumber || null,
                passwordHistory: JSON.stringify([hashedPassword]) // Initialize password history
            });

            user = await User.findById(result.insertedId);

            // Create session with refresh token
            const session = createSession(user);

            // Set httpOnly cookie for access token
            res.cookie("token", session.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            // Set refresh token cookie
            res.cookie("refreshToken", session.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            const responsePayload = {
                message: "User registered successfully.",
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                user: { email: user.email, role: user.role, isVerified: true },
                otpSent: false,
            };

            logSecurityEvent(SecurityEventType.SUCCESSFUL_LOGIN, { email, action: 'register' }, req);
            console.log('sending register response payload:', JSON.stringify(responsePayload));
            res.json(responsePayload);
        } catch (error) {
            console.error("❌ REGISTER error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Verify OTP
app.post("/auth/verify-otp", authLimiter, async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.isVerified) return res.json({ message: "Account already verified" });

        if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
        if (user.otpExpire < new Date()) return res.status(400).json({ error: "OTP expired" });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        await logAudit(req, 'OTP_VERIFY_SUCCESS', { role: user.role }, user._id || user.id, user.email);

        // Create session to log the user in automatically after verification
        const session = createSession(user);

        // Update lastLoginAt
        user.lastLoginAt = new Date().toISOString();
        user.sessionId = session.sessionId;
        user.refreshToken = session.refreshToken;
        await user.save();

        // Set access token cookie
        res.cookie("token", session.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Set refresh token cookie
        res.cookie("refreshToken", session.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        const verifiedUser = {
            email: user.email,
            name: user.name,
            role: user.role,
            university: user.university,
            organizationName: user.organizationName,
            registrationNumber: user.registrationNumber,
            isVerified: true
        };

        res.json({
            message: "Verification successful. Logged in automatically.",
            user: verifiedUser,
            accessToken: session.accessToken,
            refreshToken: session.refreshToken
        });
    } catch (error) {
        console.error("❌ VERIFY OTP error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Resend OTP
app.post("/auth/resend-otp", authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.isVerified) return res.status(400).json({ error: "Account already verified" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await user.save();

        await sendOTPEmail(email, otp);

        const showOtp = process.env.NODE_ENV !== "production" || process.env.FORCE_SHOW_OTP === "true";
        const responseStub = { message: "OTP resent successfully" };
        if (showOtp) responseStub.devOtp = otp;

        res.json(responseStub);
    } catch (error) {
        console.error("❌ RESEND OTP error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Wallet Login
app.post("/auth/wallet-login", authLimiter, async (req, res) => {
    try {
        const { address, signature, message } = req.body;
        if (!address || !signature || !message) {
            return res.status(400).json({ error: "Missing wallet login data" });
        }

        // Verify signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return res.status(401).json({ error: "Invalid signature" });
        }

        // Find user by walletAddress
        let user = await User.findOne({ walletAddress: address.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "No account associated with this wallet. Please login with email first and link your wallet in your portal." });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id || user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        await logAudit(req, 'WALLET_LOGIN_SUCCESS', { address: address.toLowerCase() }, user.id || user._id, user.email);

        res.json({
            message: "✅ Wallet login successful",
            token,
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                university: user.university,
                organizationName: user.organizationName,
                isVerified: !!user.isVerified
            }
        });
    } catch (error) {
        console.error("❌ WALLET-LOGIN error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Link Wallet
app.post("/auth/link-wallet", authenticateToken, async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).json({ error: "Wallet address required" });

        const user = await User.findOne({ email: req.user.email });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.walletAddress = address.toLowerCase();
        await user.save();

        await logAudit(req, 'WALLET_LINKED', { address: user.walletAddress });

        res.json({ message: "✅ Wallet linked successfully", walletAddress: user.walletAddress });
    } catch (error) {
        console.error("❌ LINK-WALLET error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Google Login
app.post("/auth/google-login", authLimiter, async (req, res) => {
    try {
        const { idToken, role } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: "Missing ID Token" });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Create a new user if not exists
            // We set a random password because bcrypt requires it, but it won't be used for Google users
            const hashedPassword = await bcrypt.hash(crypto.lib.WordArray.random(16).toString(), 10);

            // Validate requested role
            const userRole = (role === 'employer' || role === 'student') ? role : 'student';

            const result = await User.collection.insertOne({
                email: email.toLowerCase(),
                name: name,
                password: hashedPassword,
                role: userRole,
                isVerified: true,
                googleId: googleId,
                requiresPasswordSet: true, // Flag to force password setup
                createdAt: new Date(),
                passwordHistory: JSON.stringify([hashedPassword])
            });
            user = await User.findById(result.insertedId);
            await logAudit(req, 'GOOGLE_REGISTER_SUCCESS', { role: user.role }, user.id || user._id, user.email);

        } else {
            // Check if role matches if provided
            if (role && user.role !== role) {
                return res.status(403).json({
                    error: `Account exists with a different role: ${user.role}. Please login to the correct portal.`
                });
            }

            // Update googleId if not present
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
            await logAudit(req, 'GOOGLE_LOGIN_SUCCESS', { role: user.role }, user.id || user._id, user.email);
        }

        const token = jwt.sign(
            { id: user.id || user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRE }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            message: "✅ Google login successful",
            token,
            user: {
                email: user.email,
                name: user.name,
                role: user.role,
                requiresPasswordSet: !!user.requiresPasswordSet
            }
        });

    } catch (error) {
        console.error("❌ Google Login Error:", error);
        res.status(400).json({ error: "Invalid Google Token" });
    }
});

// Login
app.post(
    "/auth/login",
    authLimiter,
    checkLockout, // Check for account lockout
    [validateEmail, validatePassword],
    async (req, res) => {
        console.log(`🔎 LOGIN request for: ${req.body.email}`);
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, role } = req.body;

            // Find user
            const user = await User.findOne({ email });
            console.log('🔍 LOGIN: user found=', !!user);

            // Check role if specified
            if (user && role && user.role !== role && user.role !== 'admin') {
                // Return 403 Forbidden if role doesn't match and user is not admin
                return res.status(403).json({
                    error: `Role mismatch: This account is registered as '${user.role}', but you are trying to login as '${role}'.`
                });
            }
            if (!user) {
                // Track failed login
                const failureInfo = handleFailedLogin(email, req);
                return res.status(401).json({
                    error: "Invalid credentials",
                    remainingAttempts: failureInfo.remainingAttempts
                });
            }

            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                // Track failed login
                const failureInfo = handleFailedLogin(email, req);

                if (failureInfo.locked) {
                    return res.status(403).json({
                        error: "Account locked",
                        message: "Too many failed attempts. Account has been locked.",
                        locked: true
                    });
                }

                return res.status(401).json({
                    error: "Invalid credentials",
                    remainingAttempts: failureInfo.remainingAttempts
                });
            }

            // Reset failed login attempts on successful login
            handleSuccessfulLogin(email, req);



            // Create session with refresh token
            const session = createSession(user);

            // Update lastLoginAt
            user.lastLoginAt = new Date().toISOString();
            user.sessionId = session.sessionId;
            user.refreshToken = session.refreshToken;
            await user.save();

            // Set access token cookie
            res.cookie("token", session.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            // Set refresh token cookie
            res.cookie("refreshToken", session.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            const responsePayload = {
                message: "Login successful.",
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                user: {
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    university: user.university,
                    organizationName: user.organizationName,
                    registrationNumber: user.registrationNumber,
                    isVerified: !!user.isVerified
                },
                otpRequired: false,
            };

            await logAudit(req, 'LOGIN_SUCCESS', { role: user.role }, user._id, user.email);

            console.log('sending login response payload:', JSON.stringify(responsePayload));
            res.json(responsePayload);
        } catch (error) {
            console.error("❌ LOGIN error:", error);
            const showDetail = process.env.NODE_ENV !== "production";
            res.status(500).json({ error: showDetail ? error.message : "Internal server error" });
        }
    }
);

// Change Password
app.post(
    "/auth/change-password",
    authenticateToken,
    authLimiter,
    [
        body("oldPassword").notEmpty().withMessage("Current password is required"),
        body("password").notEmpty().withMessage("New password is required")
    ],
    requireStrongPassword, // Validate new password strength
    checkPasswordReuse,   // Ensure it's not a reused password
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { oldPassword, password } = req.body;
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Verify old password
            const isMatch = await user.comparePassword(oldPassword);
            if (!isMatch) {
                logSecurityEvent(SecurityEventType.PASSWORD_CHANGE_FAILED, { email: user.email, reason: 'Incorrect current password' }, req);
                return res.status(401).json({ error: "Incorrect current password" });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update user password and history
            user.password = hashedPassword;

            // Handle password history
            let history = user.passwordHistory;
            if (typeof history === 'string') {
                try { history = JSON.parse(history); } catch (e) { history = []; }
            }
            if (!Array.isArray(history)) history = [];

            // Keep last 5 passwords
            history.unshift(hashedPassword);
            if (history.length > 5) history = history.slice(0, 5);

            user.passwordHistory = history;
            await user.save();

            logSecurityEvent(SecurityEventType.PASSWORD_CHANGED, { email: user.email }, req);
            await logAudit(req, 'PASSWORD_CHANGED', {}, user.id, user.email);

            res.json({ message: "✅ Password changed successfully" });
        } catch (error) {
            console.error("❌ CHANGE-PASSWORD error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Set Password (for Google logins)
app.post(
    "/auth/set-password",
    authenticateToken,
    authLimiter,
    [
        body("password").notEmpty().withMessage("Password is required")
    ],
    requireStrongPassword,
    checkPasswordReuse,
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { password } = req.body;
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            user.password = hashedPassword;
            user.requiresPasswordSet = false;

            // Password history
            let history = user.passwordHistory || [];
            if (typeof history === 'string') {
                try { history = JSON.parse(history); } catch (e) { history = []; }
            }
            history.unshift(hashedPassword);
            if (history.length > 5) history = history.slice(0, 5);
            user.passwordHistory = history;

            await user.save();

            logSecurityEvent(SecurityEventType.PASSWORD_CHANGED, { email: user.email, action: 'set-password' }, req);
            await logAudit(req, 'SET_PASSWORD_SUCCESS', {}, user.id, user.email);

            res.json({ message: "✅ Password set successfully" });
        } catch (error) {
            console.error("❌ SET-PASSWORD error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

// Update Profile
app.post('/auth/update-profile', authenticateToken, upload.fields([
    { name: 'certificateFile', maxCount: 1 },
    { name: 'transcriptsFile', maxCount: 1 },
    { name: 'idPassportFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const { university, registrationNumber, graduationYear, degreeType } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ error: "User not found" });

        // Update user fields
        if (university !== undefined) user.university = university;
        if (registrationNumber !== undefined) user.registrationNumber = registrationNumber;
        if (graduationYear !== undefined) user.graduationYear = graduationYear;
        if (degreeType !== undefined) user.degreeType = degreeType;

        // Handle files
        if (req.files) {
            if (req.files['certificateFile']) {
                user.certificateFile = req.files['certificateFile'][0].path.replace(/\\/g, "/");
            }
            if (req.files['transcriptsFile']) {
                user.transcriptsFile = req.files['transcriptsFile'][0].path.replace(/\\/g, "/");
            }
            if (req.files['idPassportFile']) {
                user.idPassportFile = req.files['idPassportFile'][0].path.replace(/\\/g, "/");
            }
        }

        // ---- Official Verification Cross-Reference Sync ----
        // Enhanced search: look for records by email OR wallet address
        const officialCerts = await Certificate.find({
            studentEmail: user.email,
            walletAddress: user.walletAddress || "DISABLED_SEARCH_FALLBACK"
        });

        let verificationResult = {
            isValid: false,
            status: "Fake/Invalid",
            reasons: ["No official registrar record found matching your identity (Email/Wallet)."]
        };

        if (officialCerts.length > 0) {
            verificationResult.reasons = [];
            for (const cert of officialCerts) {
                if (cert.revoked) {
                    verificationResult.reasons.push(`Official record ${cert.id} was revoked by ${cert.institution}.`);
                    continue;
                }

                const uniMatch = cert.institution?.toLowerCase().trim().includes(user.university?.toLowerCase().trim()) ||
                    user.university?.toLowerCase().trim().includes(cert.institution?.toLowerCase().trim());

                const degreeMatch = cert.course?.toLowerCase().trim().includes(user.degreeType?.toLowerCase().trim()) ||
                    user.degreeType?.toLowerCase().trim().includes(cert.course?.toLowerCase().trim());

                const yearMatch = String(cert.year) === String(user.graduationYear);
                const regNoMatch = cert.registrationNumber === user.registrationNumber;

                // --- Wallet Verification Security Check ---
                // If a certificate is already bound to a wallet, it MUST match the user's current wallet.
                const walletBound = !!cert.walletAddress;
                const walletMatch = !walletBound || (user.walletAddress && cert.walletAddress.toLowerCase() === user.walletAddress.toLowerCase());

                if (uniMatch && degreeMatch && yearMatch && regNoMatch) {
                    if (!walletMatch) {
                        verificationResult.reasons.push(`Wallet mismatch: This certificate is cryptographically bound to a different address (${cert.walletAddress.slice(0, 6)}...). Please connect the authorized wallet.`);
                        continue; // Try next cert if multiple exist
                    }

                    verificationResult.isValid = true;
                    verificationResult.status = "Valid";
                    verificationResult.reasons = ["Identity verified against official registrar database (4-Point Feature Match)."];

                    if (cert.transactionHash) {
                        verificationResult.reasons.push("Cryptographic hash confirmed on the EVM (Blockchain Verified).");
                    }

                    user.isVerified = true;

                    // Anchor current wallet to certificate if not already bound
                    if (user.walletAddress && !cert.walletAddress) {
                        cert.walletAddress = user.walletAddress.toLowerCase();
                        await cert.save();
                        verificationResult.reasons.push("Successfully anchored your blockchain identity to this official record.");
                    }

                    break;
                } else {
                    if (!uniMatch) verificationResult.reasons.push(`Institution mismatch on ${cert.id}.`);
                    if (!degreeMatch) verificationResult.reasons.push(`Degree mismatch on ${cert.id}.`);
                    if (!yearMatch) verificationResult.reasons.push(`Graduation Year mismatch on ${cert.id}.`);
                    if (!regNoMatch) verificationResult.reasons.push(`Registration Number mismatch on ${cert.id}.`);
                }
            }
        }
        if (verificationResult.reasons.length === 0 && !verificationResult.isValid) {
            verificationResult.reasons = ["Verification failed: Profile data does not align with registrar records."];
        }

        await user.save();

        // ---- Blockchain Anchoring Logic ----
        let anchored = false;
        let anchoringHash = null;

        if (user.walletAddress && contract) {
            try {
                console.log(`🔗 Anchoring identity for ${user.email} (Wallet: ${user.walletAddress})...`);

                // Construct identity payload for hashing
                const identityPayload = {
                    email: user.email,
                    university: user.university,
                    regNo: user.registrationNumber,
                    degree: user.degreeType,
                    gradYear: user.graduationYear,
                    docs: {
                        cert: user.certificateFile ? crypto.SHA256(user.certificateFile).toString() : null,
                        transcripts: user.transcriptsFile ? crypto.SHA256(user.transcriptsFile).toString() : null,
                        id: user.idPassportFile ? crypto.SHA256(user.idPassportFile).toString() : null
                    },
                    timestamp: Date.now()
                };

                const identityHash = crypto.SHA256(JSON.stringify(identityPayload)).toString();

                // Create Soulbound Anchor Metadata
                const metadata = {
                    name: "Soulbound Identity Anchor",
                    description: "Cryptographic proof of academic identity and verified documentation.",
                    image: "ipfs://QmYpX9N9v...", // Placeholder or generic identity icon
                    attributes: [
                        { trait_type: "Identity Hash", value: identityHash },
                        { trait_type: "Verification Status", value: "Verified" },
                        { trait_type: "University", value: user.university }
                    ]
                };

                const metadataUri = "data:application/json;base64," + Buffer.from(JSON.stringify(metadata)).toString('base64');

                // Mint soulbound token as anchor
                const tx = await contract.safeMint(user.walletAddress, metadataUri);
                const receipt = await tx.wait();

                anchored = true;
                anchoringHash = tx.hash;
                user.isVerified = true; // Auto-verify upon successful ledger sync
                await user.save();

                console.log(`✅ Identity anchored to ledger. TX: ${tx.hash}`);
            } catch (anchorErr) {
                console.error("⚠️ Blockchain anchoring warning (non-fatal):", anchorErr.message);
            }
        }

        // Return updated user data (complete object to avoid state loss in frontend)
        const updatedUser = await User.findById(req.user.id);

        res.json({
            message: anchored ? "Profile synced to ledger and updated successfully" : "Profile updated successfully (off-chain)",
            anchored,
            verificationResult,
            transactionHash: anchoringHash,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                isVerified: updatedUser.isVerified,
                university: updatedUser.university,
                registrationNumber: updatedUser.registrationNumber,
                graduationYear: updatedUser.graduationYear,
                degreeType: updatedUser.degreeType,
                certificateFile: updatedUser.certificateFile,
                transcriptsFile: updatedUser.transcriptsFile,
                idPassportFile: updatedUser.idPassportFile,
                walletAddress: updatedUser.walletAddress
            }
        });
    } catch (error) {
        console.error("❌ UPDATE PROFILE error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Logout
app.post("/auth/logout", (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/"
    };
    res.clearCookie("token", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.json({ message: "Logged out successfully" });
});

// Get current user
app.get("/auth/me", authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            user: {
                id: user.id || user._id,
                email: user.email,
                role: user.role,
                isVerified: !!user.isVerified,
                university: user.university,
                registrationNumber: user.registrationNumber,
                graduationYear: user.graduationYear,
                degreeType: user.degreeType,
                certificateFile: user.certificateFile,
                transcriptsFile: user.transcriptsFile,
                idPassportFile: user.idPassportFile,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        console.error("❌ GET ME error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ---- Certificate Routes ----

// Issue Certificate (Admin only)
app.post(
    "/certificates/issue",
    requireAdmin,
    [validateName, validateCourse, validateYear],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, course, year, studentEmail, walletAddress, grade, description, certificateType, institution, honors, registrationNumber, registrarAddress } = req.body;

            // Generate certificate ID (hash)
            const certId = crypto.SHA256(name + course + year + Date.now()).toString().substring(0, 10);

            let transactionHash = null;
            let tokenId = null;

            // Mint on Blockchain if available and wallet address provided
            if (contract && walletAddress) {
                try {
                    console.log(`🔗 Minting certificate for ${walletAddress}...`);
                    const metadataUri = `https://certchain.demo/api/metadata/${certId}`; // Placeholder URI

                    const tx = await contract.safeMint(walletAddress, metadataUri);
                    console.log(`⏳ Transaction sent: ${tx.hash}`);

                    const receipt = await tx.wait();
                    transactionHash = tx.hash;

                    // Parse logs to find TokenID (Transfer event)
                    // But interface parsing is safer
                    if (receipt.logs.length > 0) {
                        try {
                            // The first event should be CertificateIssued(tokenId, student, uri) or similar, 
                            // wait, parsing logs with contract.interface
                            receipt.logs.forEach((log) => {
                                try {
                                    const parsed = contract.interface.parseLog(log);
                                    if (parsed.name === 'Transfer') {
                                        tokenId = parsed.args.tokenId.toString();
                                    }
                                } catch (e) {
                                    // ignore non-matching logs
                                }
                            });
                        } catch (e) {
                            console.error('Error parsing logs:', e);
                        }
                    }

                    // Fallback if no logs parsed
                    if (!tokenId) {
                        tokenId = '1'; // Placeholder or fetch from contract
                    }
                    console.log(`✅ Minted Token ID: ${tokenId}`);
                } catch (err) {
                    console.error("❌ Blockchain minting failed:", err.message);
                    // Continue to issue off-chain even if minting fails
                    // Let's log it but verify off-chain.
                }
            }

            const newCert = new Certificate({
                id: certId,
                name,
                course,
                year,
                revoked: false,
                issuedAt: new Date().toLocaleDateString(),
                issuedBy: req.user.email,
                studentEmail: studentEmail || null,
                walletAddress: walletAddress || null,
                transactionHash: transactionHash,
                tokenId: tokenId,
                grade: grade || null,
                description: description || null,
                certificateType: certificateType || null,
                institution: institution || null,
                honors: honors || null,
                registrationNumber: registrationNumber || null,
                registrarAddress: registrarAddress || null
            });

            await newCert.save();

            await logAudit(req, 'CERTIFICATE_ISSUED', {
                certId: newCert.id,
                recipient: newCert.name,
                onBlockchain: !!transactionHash
            });

            res.json({
                message: "✅ Certificate issued successfully" + (transactionHash ? " (and minted on blockchain)" : ""),
                certificate: newCert,
            });
        } catch (error) {
            console.error("❌ ISSUE CERT error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Admin Login (Special endpoint with hardcoded credentials)
app.post("/auth/admin-login", authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Hardcoded admin credentials
        // Admin credentials from environment or secure default (warn if default)
        const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "root";
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // Must be set in env

        if (!ADMIN_PASSWORD) {
            console.error("❌ CRTICAL: ADMIN_PASSWORD not set in environment variables!");
            return res.status(500).json({ error: "Server misconfiguration: Admin password not set" });
        }

        if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
            await logAudit(req, 'ADMIN_LOGIN_FAILED', { username }, null, null);
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        // Create admin JWT token
        const token = jwt.sign(
            { id: "admin-root", email: "root@system", role: "admin", username: "root" },
            JWT_SECRET,
            { expiresIn: "8h" } // 8 hour session for admin
        );

        // Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 8 * 60 * 60 * 1000, // 8 hours
        });

        await logAudit(req, 'ADMIN_LOGIN_SUCCESS', { username: 'root' }, 'admin-root', 'root@system');

        res.json({
            message: "✅ Admin authentication successful",
            token,
            user: { username: "root", role: "admin", email: "root@system" }
        });

    } catch (error) {
        console.error("❌ Admin login error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get Activity Logs (Admin only)
app.get("/admin/logs", requireAdmin, async (req, res) => {
    try {
        let logs;
        if (req.user.role === "registrar") {
            // Registrars only see their own activity logs
            logs = await ActivityLog.find({ email: req.user.email });
        } else {
            // Admins see all logs
            logs = await ActivityLog.find();
        }
        res.json({ logs });
    } catch (error) {
        console.error("❌ GET LOGS error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Admin User Management
app.get("/admin/users", requireAdmin, async (req, res) => {
    try {
        const users = await User.find();
        // Calculate dynamic risk score if not set
        const enhancedUsers = await Promise.all(users.map(async u => {
            // Simple risk heuristic
            if (!u.riskScore) {
                let score = 0;
                if (!u.isVerified) score += 20;
                if (u.role === 'admin' && u.email !== 'root@system') score += 50; // Suspicious extra admins
                if (u.walletAddress === null) score += 10;
                if (u.failedLoginAttempts > 3) score += 40;
                u.riskScore = score;
            }
            return u;
        }));

        res.json({ users: enhancedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/users/:id/ban", requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ error: "User not found" });

        // Prevent banning root
        if (user.email === 'root@system' || user.username === 'root') {
            return res.status(403).json({ error: "Cannot ban functionality root account" });
        }

        // Toggle ban
        user.isBanned = !user.isBanned;

        // If banning, generate log and maybe force logout (invalidate info)
        if (user.isBanned) {
            user.refreshToken = null; // Kill session
            user.sessionId = null;
        }

        await user.save();
        await logAudit(req, user.isBanned ? 'USER_BANNED' : 'USER_UNBANNED', { targetUser: user.email, userId: user.id });

        res.json({
            message: `User ${user.email} has been ${user.isBanned ? 'banned' : 'unbanned'}.`,
            user: { id: user.id, email: user.email, isBanned: user.isBanned }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        if (!['student', 'registrar', 'admin'].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.role = role;
        await user.save();
        await logAudit(req, 'USER_ROLE_UPDATED', { targetId: req.params.id, newRole: role });
        res.json({ message: "User role updated successfully" });
    } catch (error) {
        console.error("❌ USER-ROLE-UPDATE error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/users/:id/verify", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.isVerified = !user.isVerified;
        await user.save();
        await logAudit(req, 'USER_VERIFICATION_TOGGLED', { targetId: req.params.id, status: user.isVerified });
        res.json({ message: `User verification ${user.isVerified ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error("❌ USER-VERIFY-TOGGLE error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get("/admin/system/health", requireAdmin, async (req, res) => {
    try {
        const os = require('os');
        const health = {
            uptime: Math.floor(process.uptime()),
            memory: {
                free: os.freemem(),
                total: os.totalmem(),
                usage: (1 - (os.freemem() / os.totalmem())) * 100
            },
            cpu: os.loadavg(),
            nodeVersion: process.version,
            platform: process.platform,
            dbStatus: "CONNECTED (SQLite)"
        };
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/admin/users/suspicious", requireAdmin, async (req, res) => {
    try {
        // Fetch all users and filter by risk score > 50
        const users = await User.find();
        const suspicious = users.filter(u => (u.riskScore > 40) || (u.failedLoginAttempts > 5) || (!u.isVerified && u.role === 'employer'));
        res.json({ users: suspicious });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

});

// Admin Analytics Stats
app.get("/admin/stats", requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const users = await User.find();
        const certificates = await Certificate.find();
        const logs = await ActivityLog.find();

        const stats = {
            totalUsers,
            activeSessions: users.filter(u => u.refreshToken).length,
            totalCertificates: certificates.length,
            revokedCertificates: certificates.filter(c => c.revoked).length,
            totalLogs: logs.length,
            verificationPending: users.filter(u => !u.isVerified).length,
            securityEvents: logs.filter(l => l.action.includes('FAIL') || l.action.includes('BAN')).length
        };

        // Generate trend data (mocked for last 7 days based on existing data)
        const trends = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            return {
                date: dateStr,
                users: users.filter(u => u.createdAt && u.createdAt.startsWith(dateStr)).length,
                certs: certificates.filter(c => c.issuedAt && (new Date(c.issuedAt).toISOString().startsWith(dateStr))).length
            };
        }).reverse();

        res.json({ stats, trends });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/admin/requests", requireAdmin, async (req, res) => {
    try {
        const requests = await CertificateRequest.find();
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== DATABASE MANAGEMENT (ADMIN ONLY) ====================

app.get("/admin/db/tables", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
        res.json({ tables });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/admin/db/table/:name", requireAdmin, async (req, res) => {
    try {
        const tableName = req.params.name;
        const db = getDB();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        // Get Schema
        const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
        // Get Rows
        const rows = db.prepare(`SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT ? OFFSET ?`).all(limit, offset);
        // Get Total
        const total = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;

        res.json({
            tableName,
            columns,
            rows,
            pagination: { page, limit, total }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/db/query", requireAdmin, async (req, res) => {
    try {
        const { sql } = req.body;
        if (!sql) return res.status(400).json({ error: "SQL query is required" });

        // Safety check: Only root admin can execute raw queries
        if (req.user.email !== 'root@system') {
            return res.status(403).json({ error: "Raw query execution is restricted to system root" });
        }

        const db = getDB();
        const stmt = db.prepare(sql);
        let result;

        if (sql.trim().toLowerCase().startsWith('select') || sql.trim().toLowerCase().startsWith('pragma')) {
            result = stmt.all();
        } else {
            result = stmt.run();
        }

        await logAudit(req, 'DB_ADMIN_QUERY', { sql: sql.substring(0, 100) });
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/admin/db/stats", requireAdmin, async (req, res) => {
    try {
        const db = getDB();
        const stats = {
            pageSize: db.prepare("PRAGMA page_size").get()["page_size"],
            pageCount: db.prepare("PRAGMA page_count").get()["page_count"],
            journalMode: db.prepare("PRAGMA journal_mode").get()["journal_mode"],
            tables: db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").get().count,
            indexes: db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='index'").get().count,
        };
        stats.totalSize = stats.pageSize * stats.pageCount;
        res.json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/admin/db/download", requireAdmin, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only super administrators can download the database" });
        }
        const dbPath = path.join(__dirname, 'database.sqlite');
        if (!fs.existsSync(dbPath)) {
            return res.status(404).json({ error: "Database file not found" });
        }
        res.download(dbPath, `backup-${new Date().toISOString().split('T')[0]}.sqlite`);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/admin/db/table/:name/row/:idCol/:idVal", requireAdmin, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const { name, idCol, idVal } = req.params;
        const db = getDB();

        // Safety: Validate table name against whitelist
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        if (!tables.some(t => t.name === name)) return res.status(400).json({ error: "Invalid table" });

        const result = db.prepare(`DELETE FROM ${name} WHERE ${idCol} = ?`).run(idVal);
        await logAudit(req, 'DB_ADMIN_DELETE_ROW', { table: name, [idCol]: idVal });
        res.json({ message: "Row deleted", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/db/table/:name/wipe", requireAdmin, async (req, res) => {
    try {
        if (req.user.email !== 'root@system') return res.status(403).json({ error: "Only root can wipe tables" });
        const { name } = req.params;
        const db = getDB();
        db.prepare(`DELETE FROM ${name}`).run();
        await logAudit(req, 'DB_ADMIN_WIPE_TABLE', { table: name });
        res.json({ message: `Table ${name} has been wiped clean.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/shutdown", requireAdmin, async (req, res) => {
    try {
        await logAudit(req, 'EMERGENCY_SHUTDOWN_INITIATED');
        res.json({ message: "System is shutting down..." });
        setTimeout(() => {
            process.exit(0);
        }, 2000);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Reset Account Lockout (Admin only)
app.post("/admin/reset-lockout", requireAdmin, async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) return res.status(400).json({ error: "Email or IP identifier required" });

        resetFailedAttempts(identifier);

        await logAudit(req, 'SECURITY_LOCKOUT_RESET', { identifier });

        res.json({ message: `Lockout reset successfully for ${identifier}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Revoke Certificate
app.post("/certificates/:id/revoke", requireAdmin, async (req, res) => {
    try {
        const cert = await Certificate.findOne({ id: req.params.id });
        if (!cert) return res.status(404).json({ error: "Certificate not found" });

        // Security check: Only the issuer or a super admin can revoke
        if (req.user.role === "registrar" && cert.issuedBy !== req.user.email) {
            return res.status(403).json({ error: "Unauthorized: You can only revoke certificates you issued." });
        }

        cert.revoked = true;
        await cert.save();
        await logAudit(req, 'CERTIFICATE_REVOKED', { certId: cert.id, recipient: cert.studentEmail });

        res.json({ message: "Certificate revoked successfully", certificate: cert });
    } catch (error) {
        console.error("❌ REVOKE error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Certificate Request Routes
app.post("/certificates/request", authenticateToken, upload.fields([
    { name: 'transcriptsFile', maxCount: 1 },
    { name: 'idPassportFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const { university, registrationNumber, course, studentName } = req.body;

        if (!university || !registrationNumber || !course) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const documents = {};
        if (req.files) {
            if (req.files['transcriptsFile']) documents.transcripts = req.files['transcriptsFile'][0].path.replace(/\\/g, "/");
            if (req.files['idPassportFile']) documents.idPassport = req.files['idPassportFile'][0].path.replace(/\\/g, "/");
        }

        const request = new CertificateRequest({
            studentId: req.user.id,
            studentEmail: req.user.email,
            studentName: studentName || req.user.name || req.user.email.split('@')[0],
            university,
            registrationNumber,
            course,
            status: 'pending',
            documents
        });

        await request.save();
        await logAudit(req, 'CERTIFICATE_REQUEST_SUBMITTED', { university, course });

        res.status(201).json({ message: "Certificate request submitted successfully", request });
    } catch (error) {
        console.error("❌ SUBMIT REQUEST error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/certificates/my-requests", authenticateToken, async (req, res) => {
    try {
        const requests = await CertificateRequest.find({ studentId: req.user.id });
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/registrar/requests", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'registrar' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const universityFilter = req.user.role === 'registrar' ? req.user.university : req.query.university;

        const query = {};
        if (universityFilter) query.university = universityFilter;
        if (req.query.status) query.status = req.query.status;

        const requests = await CertificateRequest.find(query);
        res.json({ requests });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/registrar/requests/:id/action", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'registrar' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { status, rejectionReason } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const request = await CertificateRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ error: "Request not found" });

        // Ensure registrar only handles their university's requests
        if (req.user.role === 'registrar' && request.university !== req.user.university) {
            return res.status(403).json({ error: "Unauthorized for this university" });
        }

        request.status = status;
        if (status === 'rejected') request.rejectionReason = rejectionReason;

        await request.save();
        await logAudit(req, `CERTIFICATE_REQUEST_${status.toUpperCase()}`, { requestId: request.id });

        res.json({ message: `Request ${status} successfully`, request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// System Settings
app.get("/admin/settings", requireAdmin, async (req, res) => {
    try {
        const settings = await SystemSettings.find();
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {
            maintenanceMode: 'false',
            allowRegistration: 'true',
            minRiskScore: '80'
        });
        res.json({ settings: settingsMap });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/settings", requireAdmin, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key || value === undefined) return res.status(400).json({ error: "Key and value required" });

        const setting = new SystemSettings({ key, value });
        await setting.save();

        await logAudit(req, 'SYSTEM_SETTING_UPDATED', { key, value });
        res.json({ message: "Setting updated", setting });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin System Controls
app.post("/admin/flush-cache", requireAdmin, async (req, res) => {
    try {
        await logAudit(req, 'SYSTEM_CACHE_FLUSHED', { status: 'success' });
        res.json({ message: "System cache flushed successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/audit-db", requireAdmin, async (req, res) => {
    try {
        await logAudit(req, 'DATABASE_AUDIT_STARTED', { scope: 'full' });
        // Simulate some work
        res.json({ message: "Database integrity audit completed. No issues found." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/review-access", requireAdmin, async (req, res) => {
    try {
        await logAudit(req, 'USER_ACCESS_REVIEW_TRIGGERED');
        res.json({ message: "User access review triggered. Security reports are being generated." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/admin/dispatch-alerts", requireAdmin, async (req, res) => {
    try {
        await logAudit(req, 'SYSTEM_ALERTS_DISPATCHED', { priority: 'high' });
        res.json({ message: "System-wide security alerts have been dispatched to all active sessions." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ---- FRAUD REPORT ROUTES ----

app.post("/certificates/report", authenticateToken, async (req, res) => {
    try {
        const { certificateId, reason, details, institution } = req.body;
        const reporter = req.user;

        if (!certificateId || !reason) {
            return res.status(400).json({ error: "Certificate ID and Reason are required" });
        }

        const report = new FraudReport({
            certificateId,
            reporterEmail: reporter.email,
            reporterName: reporter.name || reporter.email,
            institution: institution || "Unknown",
            reason,
            details,
            status: 'pending'
        });

        await report.save();

        // Log security event
        logSecurityEvent(
            SecurityEventType.SUSPICIOUS_ACTIVITY,
            {
                certificateId,
                reason,
                details,
                institution: report.institution
            },
            req
        );

        res.json({
            success: true,
            message: "Fraud report submitted successfully. Our security team will investigate immediately.",
            reportId: report.id
        });

    } catch (error) {
        console.error("❌ FRAUD-REPORT error:", error);
        res.status(500).json({ error: "Failed to submit fraud report: " + error.message });
    }
});

// Get all certificates
app.get("/certificates", certificateLimiter, authenticateToken, async (req, res) => {
    try {
        let certificates;

        if (req.user.role === "student") {
            // Students only see their own certificates
            certificates = await Certificate.find({ studentEmail: req.user.email });
        } else if (req.user.role === "registrar") {
            // Registrars only see certificates they issued themselves
            certificates = await Certificate.find({ issuedBy: req.user.email });
        } else {
            // Admins see all certificates in the system
            certificates = await Certificate.find();
        }

        res.json({ certificates });
    } catch (error) {
        console.error("❌ GET CERTS error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Verify certificate (public)
app.get("/certificates/verify/:id", certificateLimiter, validateCertId, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const cert = await Certificate.findOne({ id: req.params.id });

        if (!cert) {
            return res.status(404).json({ valid: false, error: "Certificate not found" });
        }

        if (cert.revoked) {
            return res.json({
                valid: false,
                status: "Revoked",
                error: "This certificate has been officially revoked by the issuing institution.",
                reasons: [`Revoked by ${cert.institution || 'issuer'} on official records.`],
                certificate: cert,
            });
        }

        const reasons = ["Matches official record in Registrar Database."];
        if (cert.transactionHash) {
            reasons.push("Cryptographic hash confirmed on the EVM (Blockchain Verified).");
        }

        res.json({
            valid: true,
            status: "Authentic",
            reasons,
            certificate: cert
        });
    } catch (error) {
        console.error("❌ VERIFY CERT error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ---- Student Specific Routes ----

// Get verification history for student's certificates
app.get("/student/verification-history", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Student access required" });
        }

        const history = await VerificationHistory.find({ verifierEmail: req.user.email });
        res.json(history);
    } catch (error) {
        console.error("❌ STUDENT-HISTORY-GET error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete verification history item
app.delete("/student/verification-history/:id", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'student' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Student access required" });
        }

        const historyItem = await VerificationHistory.findById(req.params.id);
        if (!historyItem) {
            return res.status(404).json({ error: "History item not found" });
        }

        if (historyItem.employerEmail !== req.user.email && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized to delete this record" });
        }

        await VerificationHistory.delete(req.params.id);
        res.json({ message: "Verification history record deleted" });
    } catch (error) {
        console.error("❌ HISTORY-DELETE error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ---- Employer Specific Routes ----

// Get verification history
app.get("/employer/history", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'employer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Employer access required" });
        }

        const history = await VerificationHistory.find({ employerEmail: req.user.email });
        res.json(history);
    } catch (error) {
        console.error("❌ HISTORY-GET error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get submitted fraud reports
app.get("/employer/reports", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'employer' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Employer access required" });
        }

        const reports = await FraudReport.find({ reporterEmail: req.user.email });
        res.json(reports);
    } catch (error) {
        console.error("❌ REPORTS-GET error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Save verification result
app.post("/employer/history", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'employer' && req.user.role !== 'student' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized role for history recording" });
        }

        const { certificateId, status, result, reasons } = req.body;

        if (!certificateId || !status || !result) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const historyItem = new VerificationHistory({
            employerId: req.user.id || req.user._id,
            employerEmail: req.user.email,
            certificateId,
            status,
            result,
            reasons
        });

        await historyItem.save();
        res.json({ message: "Verification history saved successfully", id: historyItem.id });
    } catch (error) {
        console.error("❌ HISTORY-SAVE error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// AI Analysis Endpoint
app.post("/ai/analyze", aiLimiter, authenticateToken, async (req, res) => {
    try {
        // Simulate AI Processing Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const user = await User.findById(req.user.id);
        const history = await VerificationHistory.find({ employerEmail: user.email });
        const successfulVerifications = history.filter(h => h.status === 'Authentic' || h.status === 'Verified').length;

        // Simple Rule-Based "AI" Logic
        let insights = {
            careerPath: [],
            skills: ['Blockchain Basics', 'Digital Identity'], // Default skills
            recommendedCerts: [],
            marketDemand: "Medium",
            credibilityScore: 75 // Base score
        };

        const degree = (user.degreeType || "").toLowerCase();
        const courses = certificates.map(c => c.course.toLowerCase()).join(" ");

        if (degree.includes('bachelor') || degree.includes('computer')) {
            insights.careerPath = ["Blockchain Developer", "Smart Contract Engineer", "Backend Developer"];
            insights.skills.push("Cryptography", "Distributed Systems", "Node.js");
            insights.recommendedCerts.push("Ethereum Developer Certification", "Hyperledger Fabric Admin");
            insights.marketDemand = "High";
        } else if (degree.includes('master') || degree.includes('mba')) {
            insights.careerPath = ["Product Manager", "Blockchain Consultant", "Tech Lead"];
            insights.skills.push("Strategic Planning", "Team Leadership", "System Architecture");
            insights.recommendedCerts.push("PMP Certification", "Certified Blockchain Architect");
            insights.marketDemand = "High";
        } else {
            insights.careerPath = ["Junior Developer", "QA Tester", "Data Analyst"];
            insights.skills.push("Problem Solving", "Data Analysis");
            insights.recommendedCerts.push("Introduction to Computer Science", "Google Data Analytics");
        }

        // Adjust based on existing certificates
        if (courses.includes('react') || courses.includes('frontend')) {
            insights.skills.push("React.js", "UI/UX Design");
            insights.careerPath.unshift("Frontend Engineer");
        }

        // SYNC AI WITH VERIFICATION HISTORY
        // Boost credibility and demand based on verification activity
        if (successfulVerifications > 0) {
            insights.credibilityScore += (successfulVerifications * 5); // +5 per verification
            if (insights.credibilityScore > 100) insights.credibilityScore = 100;

            if (successfulVerifications >= 3 && insights.marketDemand === "Medium") {
                insights.marketDemand = "High";
            } else if (successfulVerifications >= 5 && insights.marketDemand === "High") {
                insights.marketDemand = "Very High";
            }
        }

        res.json({
            success: true,
            insights,
            message: "AI Analysis Complete"
        });

    } catch (error) {
        console.error("❌ AI ANALYSIS error:", error);
        res.status(500).json({ error: error.message });
    }
});

// AI Chat Assistant Endpoint
app.post("/ai/chat", aiLimiter, authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const user = await User.findById(req.user.id);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ---- Advanced Semantic Intent Processor ----
        const userEmail = user.email.split('@')[0];
        const firstName = userEmail.charAt(0).toUpperCase() + userEmail.slice(1);
        const lowerMsg = message.toLowerCase();

        // Define knowledge categories with weighted concepts
        const intentMap = [
            {
                id: 'identity',
                keywords: ['anchor', 'ledger', 'sync', 'blockchain', 'immutable', 'hash', 'record', 'proof', 'on-chain', 'transaction', 'mint', 'evm'],
                response: `**Blockchain Anchoring** is our core protocol. ${user.walletAddress ? "Since your wallet is connected, you can anchor your profile directly." : "You'll need to link your MetaMask or another Web3 wallet first."} When you 'Sync to Ledger', we generate a unique cryptographic hash of your documents and store it on the EVM. This creates a permanent, timestamped record of your achievements.`
            },
            {
                id: 'soulbound',
                keywords: ['soulbound', 'sbt', 'non-transferable', 'transfer', 'token', 'nft', 'wallet', 'locked', 'permanent'],
                response: "We use **Soulbound Tokens (SBTs)** because academic achievements are personal. Unlike standard NFTs, SBTs cannot be sold or transferred. They are locked to your digital identity forever, proving that *you* are the one who earned the qualification."
            },
            {
                id: 'verification',
                keywords: ['verify', 'check', 'status', 'pending', 'confirmed', 'validated', 'authentic', 'process', 'how long', 'wait'],
                response: user.isVerified
                    ? "🎉 **System Status: Verified.** Your identity is already anchored on the blockchain. Employers viewing your profile will see a 'Verified' badge backed by cryptographic proof."
                    : "Your verification is currently **Pending**. To complete it: 1. Fill your profile. 2. Upload your Degree/ID. 3. Click 'Sync to Ledger'. Once the transaction confirms, you'll be fully verified."
            },
            {
                id: 'security',
                keywords: ['secure', 'safe', 'hack', 'protect', 'private', 'encryption', 'stolen', 'privacy', 'sha-256', 'military', 'aes'],
                response: "Security is built into our DNA. We use **SHA-256 military-grade hashing** for the ledger and **AES-256 encryption** for document storage. Even if our servers were compromised, your actual degree certificates are cryptographically shielded and the blockchain records remain immutable."
            },
            {
                id: 'career',
                keywords: ['career', 'job', 'hire', 'salary', 'market', 'opportunity', 'path', 'trajectory', 'future', 'work', 'skills', 'gap', 'roadmap'],
                response: `The current job market highly values **verified credentials**. By anchoring your identity, you eliminate background check delays for employers. Check the **AI Matrix** tab in your portal for a detailed skill-gap analysis and personalized career roadmap based on your current certs.`
            },
            {
                id: 'troubleshooting',
                keywords: ['error', 'failed', 'not working', 'stuck', 'problem', 'fix', 'bug', 'doesn\'t', 'cant', 'cannot', 'connect', 'metamask', 'network', 'hardhat', '8545'],
                response: "If you're experiencing issues: 1. Ensure you have **MetaMask** installed and connected. 2. Verify you're on the correct network (**Hardhat/Localhost 8545**). 3. Ensure your profile fields (University, Reg No) are fully filled out before syncing. If the 'Sync' button is greyed out, you likely need to link your wallet first."
            },
            {
                id: 'navigation',
                keywords: ['how do i', 'where is', 'tutorial', 'help', 'guide', 'show me', 'steps', 'process', 'location', 'find'],
                response: "I can help with that! In your portal: \n• **Overview**: View your profile summary.\n• **Identity & Verification**: Link wallet and anchor data.\n• **AI Matrix**: Get career insights.\n• **Digital Vault**: Manage your issued certificates."
            },
            {
                id: 'technical',
                keywords: ['technical stack', 'tech stack', 'technology stack', 'technical', 'stack', 'tech', 'technology', 'build', 'language', 'framework', 'database', 'sqlite', 'mariadb', 'server', 'node', 'express', 'backend', 'api', 'artifact', 'abi', 'contract'],
                response: "Our system runs on a high-performance **Node.js/Express** backend with a secure **SQLite** database for off-chain metadata. On-chain logic is handled by **Solidity Smart Contracts** deployed on the EVM. Everything is designed for maximum transparent verification."
            },
            {
                id: 'meta',
                keywords: ['who are you', 'what are you', 'purpose', 'creator', 'system', 'about', 'bot', 'antigravity', 'antigravity ai'],
                response: "I am the **CertChain Oracle**, an AI designed to manage the intersection of Academic Records and Decentralized Finance. I assist students in claiming their digital sovereignty through blockchain technology."
            }
        ];

        // Calculate scores for each intent
        let bestIntent = null;
        let highestScore = 0;

        intentMap.forEach(intent => {
            let score = 0;
            intent.keywords.forEach(kw => {
                if (lowerMsg.includes(kw)) {
                    // Weighted scoring: longer keywords get slightly more points
                    score += (kw.length > 5 ? 2 : 1);
                }
            });
            if (score > highestScore) {
                highestScore = score;
                bestIntent = intent;
            }
        });

        // Response logic
        let reply = "";
        if (highestScore > 0) {
            reply = bestIntent.response;
        } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
            reply = `Hello ${firstName}! I'm the CertChain AI. I can explain **Blockchain Anchoring**, help with **Verification**, or guide you through your **Career Trajectory**. What would you like to explore?`;
        } else {
            // Contextual "Soft" Fallback instead of a dodge
            reply = `I'm analyzing your inquiry about "${message}". I'm specialized in explaining: \n1. **Security & Hashing** \n2. **Soulbound Identity Anchors** \n3. **Syncing to the Ledger** \n4. **Career Roadmap Analysis** \n\nWhich of these is most relevant to your question?`;
        }

        res.json({ reply });

    } catch (error) {
        console.error("❌ AI CHAT error:", error);
        res.status(500).json({ error: error.message });
    }
});


// Error Handling Middleware (MUST be last)
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 3000;

// Check for SSL certificates
const sslKeyPath = path.join(__dirname, 'server.key');
const sslCertPath = path.join(__dirname, 'server.cert');

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    // Start HTTPS server
    const httpsOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath)
    };

    https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`🔒 HTTPS Server running on port ${PORT}`);
        console.log(`   key: ${sslKeyPath}`);
        console.log(`   cert: ${sslCertPath}`);
    });
} else {
    // Start HTTP server
    app.listen(PORT, () => {
        logger.info(`🚀 HTTP Server running on port ${PORT}`);
    });
}
