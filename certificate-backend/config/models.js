const bcrypt = require('bcryptjs');
const { getPool } = require('./db');
const { randomBytes } = require('crypto');

// Helper to generate unique IDs
function makeId(prefix = '') {
    return prefix + Date.now().toString(36) + '-' + randomBytes(4).toString('hex');
}

// Helper for query chaining (to match Mongoose-like syntax used in server.js)
function createQueryObject(resultData) {
    return {
        data: resultData,
        select: function (fields) {
            if (fields === '-password') {
                if (Array.isArray(this.data)) {
                    this.data.forEach(d => delete d.password);
                } else if (this.data) {
                    delete this.data.password;
                }
            }
            return this;
        },
        then: function (resolve, reject) {
            if (typeof resolve === 'function') {
                return Promise.resolve(resolve(this.data));
            }
            return Promise.resolve(this.data);
        }
    };
}

// ==================== USER MODEL ====================
class User {
    constructor(data) {
        Object.assign(this, data);
        if (!this._id && this.id) this._id = this.id;
        if (!this.id && this._id) this.id = this._id;
        if (this.isVerified !== undefined) {
            this.isVerified = !!this.isVerified;
        }
        if (this.isBanned !== undefined) {
            this.isBanned = !!this.isBanned;
        }
        this.passwordHistory = this.passwordHistory || [];
    }

    async save() {
        const pool = getPool();
        const isNew = !this.id;

        if (isNew) {
            this.id = makeId('u_');
            this._id = this.id;
            this.createdAt = new Date();
            this.isVerified = this.isVerified || false;

            await pool.execute(
                `INSERT INTO users (id, email, password, role, isVerified, otp, otpExpire, createdAt, university, organizationName, registrationNumber) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id,
                    this.email,
                    this.password,
                    this.role || 'student',
                    this.isVerified ? 1 : 0,
                    this.otp || null,
                    this.otpExpire || null,
                    this.createdAt,
                    this.university || null,
                    this.organizationName || null,
                    this.registrationNumber || null
                ]
            );
        } else {
            await pool.execute(
                `UPDATE users 
                 SET email=?, password=?, role=?, isVerified=?, otp=?, otpExpire=?, 
                     university=?, organizationName=?, registrationNumber=?, 
                     isBanned=?, riskScore=?, lastLoginAt=?, sessionId=?, refreshToken=?
                 WHERE id=?`,
                [
                    this.email,
                    this.password,
                    this.role,
                    this.isVerified ? 1 : 0,
                    this.otp || null,
                    this.otpExpire || null,
                    this.university || null,
                    this.organizationName || null,
                    this.registrationNumber || null,
                    this.isBanned ? 1 : 0,
                    this.riskScore || 0,
                    this.lastLoginAt || null,
                    this.sessionId || null,
                    this.refreshToken || null,
                    this.id
                ]
            );
        }
        return this;
    }

    async comparePassword(candidate) {
        if (!this.password) return false;
        return await bcrypt.compare(candidate, this.password);
    }

    generateOTP() {
        this.otp = Math.floor(100000 + Math.random() * 900000).toString();
        this.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        return this.otp;
    }
}

User.findOne = async function (query) {
    const pool = getPool();
    const keys = Object.keys(query);
    if (keys.length === 0) return null;

    let clause = '';
    let params = [];

    if (query.email) {
        clause = 'email = ?';
        params.push(query.email);
    } else if (query.id || query._id) {
        clause = 'id = ?';
        params.push(query.id || query._id);
    } else {
        const k = keys[0];
        clause = `\`${k}\` = ?`;
        params.push(query[k]);
    }

    const [rows] = await pool.execute(`SELECT * FROM users WHERE ${clause} LIMIT 1`, params);
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    row.isVerified = !!row.isVerified;
    row.isBanned = !!row.isBanned;
    return new User(row);
};

User.findById = async function (id) {
    if (!id) return null;
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return null;

    const user = new User(rows[0]);
    return createQueryObject(user);
};

User.find = async function (query = {}) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users');
    return rows.map(r => new User(r));
};

User.countDocuments = async function (query = {}) {
    const pool = getPool();
    const keys = Object.keys(query);
    let sql = 'SELECT COUNT(*) as c FROM users';
    let params = [];
    if (keys.length > 0) {
        sql += ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND ');
        params = Object.values(query);
    }
    const [rows] = await pool.execute(sql, params);
    return rows[0].c;
};

User.collection = {
    insertOne: async function (doc) {
        const user = new User(doc);
        await user.save();
        return { insertedId: user.id };
    }
};

// ==================== CERTIFICATE MODEL ====================
class Certificate {
    constructor(data) {
        Object.assign(this, data);
        this.revoked = !!this.revoked;
    }

    async save() {
        const pool = getPool();
        const [exists] = await pool.execute('SELECT 1 FROM certificates WHERE id = ?', [this.id]);

        if (exists.length === 0) {
            await pool.execute(
                `INSERT INTO certificates 
                 (id, name, course, year, revoked, issuedAt, issuedBy, transactionHash, tokenId, walletAddress, studentEmail, grade, description, certificateType, institution, honors, registrationNumber, registrarAddress) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id, this.name, this.course, this.year, this.revoked ? 1 : 0,
                    this.issuedAt, this.issuedBy, this.transactionHash || null,
                    this.tokenId || null, this.walletAddress || null, this.studentEmail || null,
                    this.grade || null, this.description || null, this.certificateType || null,
                    this.institution || null, this.honors || null, this.registrationNumber || null,
                    this.registrarAddress || null
                ]
            );
        } else {
            await pool.execute(
                `UPDATE certificates 
                 SET name=?, course=?, year=?, revoked=?, issuedAt=?, issuedBy=?, 
                     transactionHash=?, tokenId=?, walletAddress=?, studentEmail=?,
                     grade=?, description=?, certificateType=?, institution=?, honors=?,
                     registrationNumber=?, registrarAddress=?
                 WHERE id=?`,
                [
                    this.name, this.course, this.year, this.revoked ? 1 : 0,
                    this.issuedAt, this.issuedBy, this.transactionHash, this.tokenId,
                    this.walletAddress, this.studentEmail,
                    this.grade || null, this.description || null, this.certificateType || null,
                    this.institution || null, this.honors || null, this.registrationNumber || null,
                    this.registrarAddress || null, this.id
                ]
            );
        }
        return this;
    }
}

Certificate.findOne = async function (query) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM certificates WHERE id = ? LIMIT 1', [query.id]);
    return rows.length ? new Certificate(rows[0]) : null;
};

Certificate.find = async function (query = {}) {
    const pool = getPool();
    let sql = 'SELECT * FROM certificates';
    let params = [];
    if (query.studentEmail) {
        sql += ' WHERE studentEmail = ?';
        params.push(query.studentEmail);
    }
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => new Certificate(r));
};

// ==================== FEEDBACK MODEL ====================
class Feedback {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const pool = getPool();
        this.id = makeId('f_');
        await pool.execute(
            `INSERT INTO feedback (id, name, email, subject, feedbackType, message) VALUES (?, ?, ?, ?, ?, ?)`,
            [this.id, this.name, this.email, this.subject, this.feedbackType, this.message]
        );
        return this;
    }
}

// ==================== ACTIVITY LOG MODEL ====================
class ActivityLog {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const pool = getPool();
        this.id = makeId('log_');
        await pool.execute(
            `INSERT INTO activity_logs (id, userId, email, action, details, ip, userAgent) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [this.id, this.userId || null, this.email || null, this.action, this.details || null, this.ip || null, this.userAgent || null]
        );
        return this;
    }
}

ActivityLog.find = async function (query = {}) {
    const pool = getPool();
    let sql = 'SELECT * FROM activity_logs';
    let params = [];
    if (query.email) {
        sql += ' WHERE email = ?';
        params.push(query.email);
    }
    sql += ' ORDER BY createdAt DESC LIMIT 100';
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => new ActivityLog(r));
};

// ==================== CERTIFICATE REQUEST MODEL ====================
class CertificateRequest {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const pool = getPool();
        const isNew = !this.id;
        const docs = typeof this.documents === 'object' ? JSON.stringify(this.documents) : this.documents;

        if (isNew) {
            this.id = makeId('req_');
            await pool.execute(
                `INSERT INTO certificate_requests (id, studentId, studentEmail, studentName, university, registrationNumber, course, status, rejectionReason, documents) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [this.id, this.studentId, this.studentEmail, this.studentName, this.university, this.registrationNumber, this.course, this.status || 'pending', this.rejectionReason || null, docs]
            );
        } else {
            await pool.execute(
                `UPDATE certificate_requests SET status=?, rejectionReason=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?`,
                [this.status, this.rejectionReason, this.id]
            );
        }
        return this;
    }
}

CertificateRequest.find = async function (query = {}) {
    const pool = getPool();
    let sql = 'SELECT * FROM certificate_requests';
    let params = [];
    const keys = Object.keys(query);
    if (keys.length > 0) {
        sql += ' WHERE ' + keys.map(k => `\`${k}\` = ?`).join(' AND ');
        params = Object.values(query);
    }
    sql += ' ORDER BY createdAt DESC';
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => new CertificateRequest(r));
};

CertificateRequest.findById = async function (id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM certificate_requests WHERE id = ?', [id]);
    return rows.length ? new CertificateRequest(rows[0]) : null;
};

// ==================== VERIFICATION HISTORY MODEL ====================
class VerificationHistory {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const pool = getPool();
        this.id = makeId('vh_');
        const resJson = typeof this.result === 'object' ? JSON.stringify(this.result) : this.result;
        const reasonsJson = typeof this.reasons === 'object' ? JSON.stringify(this.reasons) : this.reasons;

        await pool.execute(
            `INSERT INTO verification_history (id, employerId, employerEmail, certificateId, status, result, reasons) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [this.id, this.employerId, this.employerEmail, this.certificateId, this.status, resJson, reasonsJson]
        );
        return this;
    }
}

VerificationHistory.find = async function (query = {}) {
    const pool = getPool();
    let sql = 'SELECT * FROM verification_history';
    let params = [];
    if (query.employerEmail) {
        sql += ' WHERE employerEmail = ?';
        params.push(query.employerEmail);
    }
    sql += ' ORDER BY createdAt DESC';
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => new VerificationHistory(r));
};

// ==================== FRAUD REPORT MODEL ====================
class FraudReport {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const pool = getPool();
        this.id = makeId('fraud_');
        await pool.execute(
            `INSERT INTO fraud_reports (id, certificateId, reporterEmail, reporterName, institution, reason, details, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [this.id, this.certificateId, this.reporterEmail, this.reporterName || null, this.institution || null, this.reason, this.details || null, this.status || 'pending']
        );
        return this;
    }
}

FraudReport.find = async function (query = {}) {
    const pool = getPool();
    let sql = 'SELECT * FROM fraud_reports';
    let params = [];
    if (query.certificateId) {
        sql += ' WHERE certificateId = ?';
        params.push(query.certificateId);
    }
    const [rows] = await pool.execute(sql, params);
    return rows.map(r => new FraudReport(r));
};

module.exports = { User, Certificate, Feedback, ActivityLog, CertificateRequest, VerificationHistory, FraudReport };
