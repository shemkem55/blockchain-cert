const mysql = require('mysql2/promise');

const SQL_HOST = process.env.DB_HOST || process.env.SQL_HOST || 'localhost';
const SQL_PORT = process.env.DB_PORT || process.env.SQL_PORT ? Number(process.env.DB_PORT || process.env.SQL_PORT) : 3306;
const SQL_USER = process.env.DB_USER || process.env.SQL_USER || 'certuser';
const SQL_PASSWORD = process.env.DB_PASSWORD || process.env.SQL_PASSWORD || '12747aluminA@';
const SQL_DB = process.env.DB_NAME || process.env.SQL_DB || 'certs_db';

let pool;

async function connectDB() {
  try {
    // Create connection pool
    pool = mysql.createPool({
      host: SQL_HOST,
      port: SQL_PORT,
      user: SQL_USER,
      password: SQL_PASSWORD,
      database: SQL_DB,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });

    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to MariaDB/MySQL database:', SQL_DB);

    // Create tables
    await createTables();

    return pool;
  } catch (error) {
    console.error('❌ MariaDB/MySQL connection failed:', error.message);
    throw error;
  }
}

async function createTables() {
  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'student',
        isVerified TINYINT(1) DEFAULT 0,
        otp VARCHAR(16) DEFAULT NULL,
        otpExpire DATETIME DEFAULT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isBanned TINYINT(1) DEFAULT 0,
        riskScore INT DEFAULT 0,
        university VARCHAR(255),
        organizationName VARCHAR(255),
        registrationNumber VARCHAR(255),
        graduationYear VARCHAR(64),
        degreeType VARCHAR(255),
        certificateFile VARCHAR(255),
        transcriptsFile VARCHAR(255),
        idPassportFile VARCHAR(255),
        walletAddress VARCHAR(255),
        lastLoginAt DATETIME,
        lastActivityAt DATETIME,
        passwordHistory JSON,
        sessionId VARCHAR(255),
        refreshToken VARCHAR(255),
        googleId VARCHAR(255),
        requiresPasswordSet TINYINT(1) DEFAULT 0,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Certificates table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS certificates (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        course VARCHAR(255) NOT NULL,
        year VARCHAR(16) NOT NULL,
        revoked TINYINT(1) DEFAULT 0,
        issuedAt VARCHAR(64),
        issuedBy VARCHAR(255),
        transactionHash VARCHAR(128),
        tokenId VARCHAR(128),
        walletAddress VARCHAR(128),
        studentEmail VARCHAR(255),
        grade VARCHAR(64),
        description TEXT,
        certificateType VARCHAR(255),
        institution VARCHAR(255),
        honors VARCHAR(255),
        registrationNumber VARCHAR(255),
        registrarAddress VARCHAR(255),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_studentEmail (studentEmail),
        INDEX idx_revoked (revoked)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Feedback table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        feedbackType VARCHAR(64) DEFAULT 'general',
        message TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_type (feedbackType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Activity Logs
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id VARCHAR(64) PRIMARY KEY,
            userId VARCHAR(64),
            email VARCHAR(255),
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip VARCHAR(64),
            userAgent TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Certificate Requests
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS certificate_requests (
            id VARCHAR(64) PRIMARY KEY,
            studentId VARCHAR(64) NOT NULL,
            studentEmail VARCHAR(255) NOT NULL,
            studentName VARCHAR(255),
            university VARCHAR(255) NOT NULL,
            registrationNumber VARCHAR(255) NOT NULL,
            course VARCHAR(255) NOT NULL,
            status VARCHAR(32) DEFAULT 'pending',
            rejectionReason TEXT,
            documents JSON,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Verification History
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS verification_history (
            id VARCHAR(64) PRIMARY KEY,
            employerId VARCHAR(64) NOT NULL,
            employerEmail VARCHAR(255) NOT NULL,
            certificateId VARCHAR(128) NOT NULL,
            status VARCHAR(32) NOT NULL,
            result JSON NOT NULL,
            reasons JSON,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Fraud Reports table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS fraud_reports (
        id VARCHAR(64) PRIMARY KEY,
        certificateId VARCHAR(128) NOT NULL,
        reporterEmail VARCHAR(255) NOT NULL,
        reporterName VARCHAR(255),
        institution VARCHAR(255),
        reason VARCHAR(255) NOT NULL,
        details TEXT,
        status VARCHAR(32) DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cert (certificateId),
        INDEX idx_reporter (reporterEmail)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return pool;
}

const getDB = getPool;

module.exports = { connectDB, getPool, getDB };

