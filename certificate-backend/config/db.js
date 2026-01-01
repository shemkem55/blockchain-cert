const mysql = require('mysql2/promise');

const SQL_HOST = process.env.SQL_HOST || 'localhost';
const SQL_PORT = process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 3306;
const SQL_USER = process.env.SQL_USER || 'certuser';
const SQL_PASSWORD = process.env.SQL_PASSWORD || '12747aluminA@';
const SQL_DB = process.env.SQL_DB || 'certs_db';

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
    console.log('✅ Connected to MariaDB database:', SQL_DB);

    // Create tables
    await createTables();

    return pool;
  } catch (error) {
    console.error('❌ MariaDB connection failed:', error.message);
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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_studentEmail (studentEmail),
        INDEX idx_revoked (revoked),
        FOREIGN KEY (studentEmail) REFERENCES users(email) ON DELETE SET NULL
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

module.exports = { connectDB, getPool };
