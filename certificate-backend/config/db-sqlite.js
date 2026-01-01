const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
let db;

async function connectDB() {
    try {
        db = new Database(DB_PATH);
        console.log('✅ Connected to SQLite database:', DB_PATH);

        // Enable WAL mode for better concurrency
        db.pragma('journal_mode = WAL');

        await createTables();
        await initializeDefaultAdmin();
        return db;
    } catch (err) {
        console.error('❌ SQLite connection failed:', err.message);
        throw err;
    }
}

async function createTables() {
    try {
        // Users table
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student',
                isVerified INTEGER DEFAULT 0,
                otp TEXT,
                otpExpire DATETIME,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                isBanned INTEGER DEFAULT 0,
                riskScore INTEGER DEFAULT 0
            )
        `);

        // Certificates table
        db.exec(`
            CREATE TABLE IF NOT EXISTS certificates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                course TEXT NOT NULL,
                year TEXT NOT NULL,
                revoked INTEGER DEFAULT 0,
                issuedAt TEXT,
                issuedBy TEXT,
                transactionHash TEXT,
                tokenId TEXT,
                walletAddress TEXT,
                studentEmail TEXT,
                grade TEXT,
                description TEXT,
                certificateType TEXT,
                institution TEXT,
                honors TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Feedback table
        db.exec(`
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                feedbackType TEXT DEFAULT 'general',
                message TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Activity Logs table
        db.exec(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                userId TEXT,
                email TEXT,
                action TEXT NOT NULL,
                details TEXT,
                ip TEXT,
                userAgent TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // System Settings table
        db.exec(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Certificate Requests table
        db.exec(`
            CREATE TABLE IF NOT EXISTS certificate_requests (
                id TEXT PRIMARY KEY,
                studentId TEXT NOT NULL,
                studentEmail TEXT NOT NULL,
                studentName TEXT,
                university TEXT NOT NULL,
                registrationNumber TEXT NOT NULL,
                course TEXT NOT NULL,
                status TEXT DEFAULT 'pending', -- pending, approved, rejected
                rejectionReason TEXT,
                documents TEXT, -- JSON string of file paths
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Verification History table
        db.exec(`
            CREATE TABLE IF NOT EXISTS verification_history (
                id TEXT PRIMARY KEY,
                employerId TEXT NOT NULL,
                employerEmail TEXT NOT NULL,
                certificateId TEXT NOT NULL,
                status TEXT NOT NULL,
                result JSON NOT NULL,
                reasons JSON,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Fraud Reports table
        db.exec(`
            CREATE TABLE IF NOT EXISTS fraud_reports (
                id TEXT PRIMARY KEY,
                certificateId TEXT NOT NULL,
                reporterEmail TEXT NOT NULL,
                reporterName TEXT,
                institution TEXT,
                reason TEXT NOT NULL,
                details TEXT,
                status TEXT DEFAULT 'pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('✅ Database tables created successfully');
        await migrate();
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    }
}

async function migrate() {
    try {
        // Users table migrations
        const userColumns = [
            'university TEXT',
            'organizationName TEXT',
            'registrationNumber TEXT',
            'graduationYear TEXT',
            'degreeType TEXT',
            'certificateFile TEXT',
            'transcriptsFile TEXT',
            'idPassportFile TEXT',
            'walletAddress TEXT',
            // Security-related fields
            'lastLoginAt DATETIME',
            'lastActivityAt DATETIME',
            'failedLoginAttempts INTEGER DEFAULT 0',
            'accountLockedUntil DATETIME',
            'passwordHistory TEXT', // JSON array of previous password hashes
            'sessionId TEXT',
            'refreshToken TEXT',
            'googleId TEXT',
            'requiresPasswordSet INTEGER DEFAULT 0',
            'isBanned INTEGER DEFAULT 0',
            'riskScore INTEGER DEFAULT 0'
        ];

        for (const col of userColumns) {
            try {
                const colName = col.split(' ')[0];
                const result = db.prepare("PRAGMA table_info(users)").all();
                const exists = result.some(c => c.name === colName);

                if (!exists) {
                    db.exec(`ALTER TABLE users ADD COLUMN ${col}`);
                    console.log(`✅ Added column ${colName} to users table`);
                }
            } catch (err) {
                console.log(`ℹ️ Column migration note: ${err.message}`);
            }
        }

        // Certificates table migrations
        const certColumns = [
            'grade TEXT',
            'description TEXT',
            'certificateType TEXT',
            'institution TEXT',
            'honors TEXT',
            'registrationNumber TEXT',
            'registrarAddress TEXT'
        ];

        for (const col of certColumns) {
            try {
                const colName = col.split(' ')[0];
                const result = db.prepare("PRAGMA table_info(certificates)").all();
                const exists = result.some(c => c.name === colName);

                if (!exists) {
                    db.exec(`ALTER TABLE certificates ADD COLUMN ${col}`);
                    console.log(`✅ Added column ${colName} to certificates table`);
                }
            } catch (err) {
                console.log(`ℹ️ Column migration note: ${err.message}`);
            }
        }

        // Create security_events table for audit logging
        db.exec(`
            CREATE TABLE IF NOT EXISTS security_events (
                id TEXT PRIMARY KEY,
                eventType TEXT NOT NULL,
                userId TEXT,
                email TEXT,
                ip TEXT,
                userAgent TEXT,
                details TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Security events table created/verified');

    } catch (err) {
        console.error('❌ Migration error:', err.message);
    }
}

async function initializeDefaultAdmin() {
    try {
        const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');

        if (row.count === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const id = 'u_' + Date.now().toString(36);

            db.prepare(`
                INSERT INTO users (id, email, password, role, isVerified, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(id, 'admin@test.com', hashedPassword, 'admin', 1, new Date().toISOString());

            console.log('👤 Default admin created: admin@test.com / admin123');
        }
    } catch (error) {
        console.error('❌ Could not create default admin:', error.message);
        throw error;
    }
}

function getDB() {
    if (!db) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return db;
}

module.exports = { connectDB, getDB };
