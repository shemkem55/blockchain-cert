const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

let pool;

async function connectDB() {
    try {
        if (connectionString) {
            pool = new Pool({
                connectionString: connectionString,
                ssl: {
                    rejectUnauthorized: false // Required for Render/managed databases
                }
            });
        } else {
            // Fallback for local development if DATABASE_URL is not set
            pool = new Pool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 5432,
                user: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || 'postgres',
                database: process.env.DB_NAME || 'blockchain_cert'
            });
        }

        // Test connection
        await pool.query('SELECT 1');
        console.log('✅ Connected to PostgreSQL database');

        // Create tables
        await createTables();

        return pool;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        throw error;
    }
}

async function createTables() {
    try {
        // Users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'student',
        isVerified BOOLEAN DEFAULT FALSE,
        otp VARCHAR(16) DEFAULT NULL,
        otpExpire TIMESTAMP DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        isBanned BOOLEAN DEFAULT FALSE,
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
        lastLoginAt TIMESTAMP,
        lastActivityAt TIMESTAMP,
        passwordHistory JSONB,
        sessionId VARCHAR(255),
        refreshToken VARCHAR(255),
        googleId VARCHAR(255),
        requiresPasswordSet BOOLEAN DEFAULT FALSE
      )
    `);

        // Certificates table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        course VARCHAR(255) NOT NULL,
        year VARCHAR(16) NOT NULL,
        revoked BOOLEAN DEFAULT FALSE,
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
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Feedback table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        feedbackType VARCHAR(64) DEFAULT 'general',
        message TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Activity Logs
        await pool.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id VARCHAR(64) PRIMARY KEY,
            userId VARCHAR(64),
            email VARCHAR(255),
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip VARCHAR(64),
            userAgent TEXT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

        // Certificate Requests
        await pool.query(`
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
            documents JSONB,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

        // Create trigger for updatedAt if it doesn't exist
        await pool.query(`
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updatedAt = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    `);

        // Add triggers (swallowing errors if they already exist)
        try {
            await pool.query(`
            CREATE TRIGGER update_certificate_requests_modtime
            BEFORE UPDATE ON certificate_requests
            FOR EACH ROW
            EXECUTE PROCEDURE update_modified_column();
        `);
        } catch (e) { }

        // Verification History
        await pool.query(`
        CREATE TABLE IF NOT EXISTS verification_history (
            id VARCHAR(64) PRIMARY KEY,
            employerId VARCHAR(64) NOT NULL,
            employerEmail VARCHAR(255) NOT NULL,
            certificateId VARCHAR(128) NOT NULL,
            status VARCHAR(32) NOT NULL,
            result JSONB NOT NULL,
            reasons JSONB,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

        // Fraud Reports table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS fraud_reports (
        id VARCHAR(64) PRIMARY KEY,
        certificateId VARCHAR(128) NOT NULL,
        reporterEmail VARCHAR(255) NOT NULL,
        reporterName VARCHAR(255),
        institution VARCHAR(255),
        reason VARCHAR(255) NOT NULL,
        details TEXT,
        status VARCHAR(32) DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Security Events Table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS security_events (
        id VARCHAR(64) PRIMARY KEY,
        eventType VARCHAR(64) NOT NULL,
        userId VARCHAR(64),
        email VARCHAR(255),
        ip VARCHAR(64),
        userAgent TEXT,
        details TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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
