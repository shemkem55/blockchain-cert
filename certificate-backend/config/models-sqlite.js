const bcrypt = require('bcryptjs');
const { getDB } = require('./db-sqlite');
const { randomBytes } = require('crypto');

// Helper to generate unique IDs
function makeId(prefix = '') {
    return prefix + Date.now().toString(36) + '-' + randomBytes(4).toString('hex');
}

// Helper functions using better-sqlite3 synchronous API
function dbRun(query, params = []) {
    const db = getDB();
    return db.prepare(query).run(...params);
}

function dbGet(query, params = []) {
    const db = getDB();
    return db.prepare(query).get(...params);
}

function dbAll(query, params = []) {
    const db = getDB();
    return db.prepare(query).all(...params);
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
        this.riskScore = this.riskScore || 0;
        this.passwordHistory = this.passwordHistory || '[]';
        this.requiresPasswordSet = !!this.requiresPasswordSet;
    }

    async save() {
        const isNew = !this.id;

        if (isNew) {
            this.id = makeId('u_');
            this._id = this.id;
            this.createdAt = new Date().toISOString();
            this.isVerified = this.isVerified || false;
            this.isBanned = this.isBanned || false;
            this.riskScore = this.riskScore || 0;
            this.passwordHistory = this.passwordHistory || '[]';

            await dbRun(
                `INSERT INTO users (id, email, password, role, isVerified, otp, otpExpire, createdAt, university, organizationName, registrationNumber, graduationYear, degreeType, certificateFile, transcriptsFile, idPassportFile, walletAddress, isBanned, riskScore, passwordHistory, requiresPasswordSet) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id,
                    this.email,
                    this.password,
                    this.role || 'student',
                    this.isVerified ? 1 : 0,
                    this.otp || null,
                    this.otpExpire ? (this.otpExpire instanceof Date ? this.otpExpire.toISOString() : this.otpExpire) : null,
                    this.createdAt,
                    this.university || null,
                    this.organizationName || null,
                    this.registrationNumber || null,
                    this.graduationYear || null,
                    this.degreeType || null,
                    this.certificateFile || null,
                    this.transcriptsFile || null,
                    this.idPassportFile || null,
                    this.walletAddress || null,
                    this.isBanned ? 1 : 0,
                    this.riskScore,
                    typeof this.passwordHistory === 'string' ? this.passwordHistory : JSON.stringify(this.passwordHistory),
                    this.requiresPasswordSet ? 1 : 0
                ]
            );
        } else {
            await dbRun(
                `UPDATE users 
                 SET email=?, password=?, role=?, isVerified=?, otp=?, otpExpire=?,
                     university=?, organizationName=?, registrationNumber=?, graduationYear=?, degreeType=?, 
                     certificateFile=?, transcriptsFile=?, idPassportFile=?, walletAddress=?, isBanned=?, riskScore=?, 
                     passwordHistory=?, requiresPasswordSet=?, lastLoginAt=?, lastActivityAt=?, sessionId=?, refreshToken=?, googleId=?
                 WHERE id=?`,
                [
                    this.email,
                    this.password,
                    this.role,
                    this.isVerified ? 1 : 0,
                    this.otp || null,
                    this.otpExpire ? (this.otpExpire instanceof Date ? this.otpExpire.toISOString() : this.otpExpire) : null,
                    this.university || null,
                    this.organizationName || null,
                    this.registrationNumber || null,
                    this.graduationYear || null,
                    this.degreeType || null,
                    this.certificateFile || null,
                    this.transcriptsFile || null,
                    this.idPassportFile || null,
                    this.walletAddress || null,
                    this.isBanned ? 1 : 0,
                    this.riskScore,
                    typeof this.passwordHistory === 'string' ? this.passwordHistory : JSON.stringify(this.passwordHistory),
                    this.requiresPasswordSet ? 1 : 0,
                    this.lastLoginAt || null,
                    this.lastActivityAt || null,
                    this.sessionId || null,
                    this.refreshToken || null,
                    this.googleId || null,
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

    isModified(field) {
        return true; // Simplified
    }
}

// Static methods for User
User.findOne = async function (query) {
    const keys = Object.keys(query);
    if (keys.length === 0) return null;

    let clause = '';
    let params = [];

    if (query.email) {
        clause = 'email = ?';
        params.push(query.email);
    } else if (query._id) {
        clause = 'id = ?';
        params.push(query._id);
    } else if (query.id) {
        clause = 'id = ?';
        params.push(query.id);
    } else {
        const k = keys[0];
        clause = k === '_id' ? 'id = ?' : `${k} = ?`;
        params.push(query[k]);
    }

    const row = await dbGet(`SELECT * FROM users WHERE ${clause} LIMIT 1`, params);
    if (!row) return null;

    row.isVerified = !!row.isVerified;
    row.otpExpire = row.otpExpire ? new Date(row.otpExpire) : null;
    row.createdAt = row.createdAt ? new Date(row.createdAt) : null;
    if (row.passwordHistory) {
        try {
            row.passwordHistory = JSON.parse(row.passwordHistory);
        } catch (e) {
            row.passwordHistory = [];
        }
    } else {
        row.passwordHistory = [];
    }

    return new User(row);
};

User.findById = async function (id) {
    if (!id) return null;
    const row = await dbGet('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (!row) return null;

    row.isVerified = !!row.isVerified;
    row.otpExpire = row.otpExpire ? new Date(row.otpExpire) : null;
    row.createdAt = row.createdAt ? new Date(row.createdAt) : null;
    if (row.passwordHistory) {
        try { row.passwordHistory = JSON.parse(row.passwordHistory); } catch (e) { row.passwordHistory = []; }
    } else {
        row.passwordHistory = [];
    }

    const user = new User(row);
    user.select = function (sel) {
        if (sel === '-password') delete this.password;
        return this;
    };

    return createQueryObject(user);
};

User.find = async function (query = {}) {
    const rows = await dbAll('SELECT * FROM users');
    const users = rows.map(row => {
        row.isVerified = !!row.isVerified;
        return new User(row);
    });
    return createQueryObject(users);
};

User.findByIdAndUpdate = async function (id, update, opts) {
    const current = await User.findById(id);
    if (!current) return null;

    const userObj = current.data || current;
    Object.assign(userObj, update);
    await userObj.save();

    return createQueryObject(new User(userObj));
};

User.findByIdAndDelete = async function (id) {
    const current = await User.findById(id);
    if (!current) return null;

    await dbRun('DELETE FROM users WHERE id = ?', [id]);
    return current;
};

User.countDocuments = async function (query = {}) {
    const keys = Object.keys(query);

    if (keys.length === 0) {
        const row = await dbGet('SELECT COUNT(*) as c FROM users');
        return row.c;
    }

    const k = keys[0];
    const row = await dbGet(`SELECT COUNT(*) as c FROM users WHERE ${k} = ?`, [query[k]]);
    return row.c;
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
        if (this.revoked !== undefined) {
            this.revoked = !!this.revoked;
        }
    }

    async save() {
        const exists = await dbGet('SELECT 1 FROM certificates WHERE id = ?', [this.id]);

        if (!exists) {
            await dbRun(
                `INSERT INTO certificates 
                 (id, name, course, year, revoked, issuedAt, issuedBy, transactionHash, tokenId, walletAddress, studentEmail, grade, description, certificateType, institution, honors, registrationNumber, registrarAddress) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id,
                    this.name,
                    this.course,
                    this.year,
                    this.revoked ? 1 : 0,
                    this.issuedAt,
                    this.issuedBy,
                    this.transactionHash || null,
                    this.tokenId || null,
                    this.walletAddress || null,
                    this.studentEmail || null,
                    this.grade || null,
                    this.description || null,
                    this.certificateType || null,
                    this.institution || null,
                    this.honors || null,
                    this.registrationNumber || null,
                    this.registrarAddress || null
                ]
            );
        } else {
            await dbRun(
                `UPDATE certificates 
                 SET name=?, course=?, year=?, revoked=?, issuedAt=?, issuedBy=?, 
                     transactionHash=?, tokenId=?, walletAddress=?, studentEmail=?,
                     grade=?, description=?, certificateType=?, institution=?, honors=?,
                     registrationNumber=?, registrarAddress=?
                 WHERE id=?`,
                [
                    this.name,
                    this.course,
                    this.year,
                    this.revoked ? 1 : 0,
                    this.issuedAt,
                    this.issuedBy,
                    this.transactionHash,
                    this.tokenId,
                    this.walletAddress,
                    this.studentEmail,
                    this.grade || null,
                    this.description || null,
                    this.certificateType || null,
                    this.institution || null,
                    this.honors || null,
                    this.registrationNumber || null,
                    this.registrarAddress || null,
                    this.id
                ]
            );
        }
        return this;
    }
}

Certificate.findOne = async function (query) {
    if (!query.id) return null;

    const row = await dbGet('SELECT * FROM certificates WHERE id = ? LIMIT 1', [query.id]);
    if (!row) return null;

    row.revoked = !!row.revoked;
    return new Certificate(row);
};

Certificate.find = async function (query = {}) {
    let sql = 'SELECT * FROM certificates';
    let params = [];
    let clauses = [];

    if (query.studentEmail) {
        clauses.push('studentEmail = ?');
        params.push(query.studentEmail);
    }
    if (query.walletAddress) {
        clauses.push('walletAddress = ?');
        params.push(query.walletAddress);
    }
    if (query.id) {
        clauses.push('id = ?');
        params.push(query.id);
    }
    if (query.issuedBy) {
        clauses.push('issuedBy = ?');
        params.push(query.issuedBy);
    }

    if (clauses.length > 0) {
        sql += ' WHERE ' + clauses.join(' OR ');
    }

    const rows = await dbAll(sql, params);
    return rows.map(row => {
        row.revoked = !!row.revoked;
        return new Certificate(row);
    });
};

// ==================== FEEDBACK MODEL ====================
class Feedback {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        this.id = makeId('f_');
        this.createdAt = new Date().toISOString();

        await dbRun(
            `INSERT INTO feedback (id, name, email, subject, feedbackType, message, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [this.id, this.name, this.email, this.subject, this.feedbackType, this.message, this.createdAt]
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
        this.id = makeId('log_');
        this.createdAt = new Date().toISOString();

        await dbRun(
            `INSERT INTO activity_logs (id, userId, email, action, details, ip, userAgent, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                this.id,
                this.userId || null,
                this.email || null,
                this.action,
                this.details || null,
                this.ip || null,
                this.userAgent || null,
                this.createdAt
            ]
        );
        return this;
    }
}

ActivityLog.find = async function (query = {}) {
    let sql = 'SELECT * FROM activity_logs';
    let params = [];

    if (query.email) {
        sql += ' WHERE email = ?';
        params.push(query.email);
    }

    sql += ' ORDER BY createdAt DESC LIMIT 100';
    const rows = await dbAll(sql, params);
    return rows.map(r => new ActivityLog(r));
};

// ==================== SYSTEM SETTINGS MODEL ====================
class SystemSettings {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const exists = await dbGet('SELECT 1 FROM system_settings WHERE key = ?', [this.key]);
        if (!exists) {
            await dbRun(
                'INSERT INTO system_settings (key, value, updatedAt) VALUES (?, ?, ?)',
                [this.key, this.value, new Date().toISOString()]
            );
        } else {
            await dbRun(
                'UPDATE system_settings SET value = ?, updatedAt = ? WHERE key = ?',
                [this.value, new Date().toISOString(), this.key]
            );
        }
        return this;
    }
}

SystemSettings.findOne = async function (key) {
    const row = await dbGet('SELECT * FROM system_settings WHERE key = ?', [key]);
    return row ? new SystemSettings(row) : null;
};

SystemSettings.find = async function () {
    const rows = await dbAll('SELECT * FROM system_settings');
    return rows.map(r => new SystemSettings(r));
};

// ==================== CERTIFICATE REQUEST MODEL ====================
class CertificateRequest {
    constructor(data) {
        Object.assign(this, data);
        if (typeof this.documents === 'string') {
            try { this.documents = JSON.parse(this.documents); } catch (e) { }
        }
    }

    async save() {
        const isNew = !this.id;
        const docs = typeof this.documents === 'object' ? JSON.stringify(this.documents) : this.documents;
        this.updatedAt = new Date().toISOString();

        if (isNew) {
            this.id = makeId('req_');
            this.createdAt = this.updatedAt;
            await dbRun(
                `INSERT INTO certificate_requests 
                 (id, studentId, studentEmail, studentName, university, registrationNumber, course, status, rejectionReason, documents, createdAt, updatedAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id,
                    this.studentId,
                    this.studentEmail,
                    this.studentName,
                    this.university,
                    this.registrationNumber,
                    this.course,
                    this.status || 'pending',
                    this.rejectionReason || null,
                    docs,
                    this.createdAt,
                    this.updatedAt
                ]
            );
        } else {
            await dbRun(
                `UPDATE certificate_requests 
                 SET studentId=?, studentEmail=?, studentName=?, university=?, registrationNumber=?, course=?, status=?, rejectionReason=?, documents=?, updatedAt=?
                 WHERE id=?`,
                [
                    this.studentId,
                    this.studentEmail,
                    this.studentName,
                    this.university,
                    this.registrationNumber,
                    this.course,
                    this.status,
                    this.rejectionReason,
                    docs,
                    this.updatedAt,
                    this.id
                ]
            );
        }
        return this;
    }
}

CertificateRequest.find = async function (query = {}) {
    let sql = 'SELECT * FROM certificate_requests';
    let params = [];
    let clauses = [];

    if (query.studentId) {
        clauses.push('studentId = ?');
        params.push(query.studentId);
    }
    if (query.university) {
        clauses.push('university = ?');
        params.push(query.university);
    }
    if (query.status) {
        clauses.push('status = ?');
        params.push(query.status);
    }

    if (clauses.length > 0) {
        sql += ' WHERE ' + clauses.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';
    const rows = await dbAll(sql, params);
    return rows.map(r => new CertificateRequest(r));
};

CertificateRequest.findById = async function (id) {
    const row = await dbGet('SELECT * FROM certificate_requests WHERE id = ?', [id]);
    return row ? new CertificateRequest(row) : null;
};

// Helper for query chaining
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
            resolve(this.data);
        }
    };
}

// ==================== VERIFICATION HISTORY MODEL ====================
class VerificationHistory {
    constructor(data) {
        Object.assign(this, data);
        if (typeof this.result === 'string') {
            try { this.result = JSON.parse(this.result); } catch (e) { }
        }
        if (typeof this.reasons === 'string') {
            try { this.reasons = JSON.parse(this.reasons); } catch (e) { }
        }
    }

    async save() {
        this.id = makeId('vh_');
        const resJson = typeof this.result === 'object' ? JSON.stringify(this.result) : this.result;
        const reasonsJson = typeof this.reasons === 'object' ? JSON.stringify(this.reasons) : this.reasons;
        this.createdAt = new Date().toISOString();

        await dbRun(
            `INSERT INTO verification_history (id, employerId, employerEmail, certificateId, status, result, reasons, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                this.id,
                this.employerId,
                this.employerEmail,
                this.certificateId,
                this.status,
                resJson,
                reasonsJson,
                this.createdAt
            ]
        );
        return this;
    }
}

VerificationHistory.find = async function (query = {}) {
    let sql = 'SELECT vh.* FROM verification_history vh';
    let params = [];

    if (query.verifierEmail || query.employerEmail) {
        sql += ' WHERE vh.employerEmail = ?';
        params.push(query.verifierEmail || query.employerEmail);
    } else if (query.studentEmail) {
        // Find verifications for certificates belonging to this student
        sql += ' JOIN certificates c ON vh.certificateId = c.id';
        sql += ' WHERE c.studentEmail = ?';
        params.push(query.studentEmail);
    }

    sql += ' ORDER BY vh.createdAt DESC';
    const rows = await dbAll(sql, params);
    return rows.map(r => new VerificationHistory(r));
};

VerificationHistory.findById = async function (id) {
    const row = await dbGet('SELECT * FROM verification_history WHERE id = ?', [id]);
    return row ? new VerificationHistory(row) : null;
};

VerificationHistory.delete = async function (id) {
    await dbRun('DELETE FROM verification_history WHERE id = ?', [id]);
    return true;
};

// ==================== FRAUD REPORT MODEL ====================
class FraudReport {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        this.id = makeId('fraud_');
        this.createdAt = new Date().toISOString();

        await dbRun(
            `INSERT INTO fraud_reports (id, certificateId, reporterEmail, reporterName, institution, reason, details, status, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                this.id,
                this.certificateId,
                this.reporterEmail,
                this.reporterName || null,
                this.institution || null,
                this.reason,
                this.details || null,
                this.status || 'pending',
                this.createdAt
            ]
        );
        return this;
    }
}

FraudReport.find = async function (query = {}) {
    let sql = 'SELECT * FROM fraud_reports';
    let params = [];
    let clauses = [];

    if (query.certificateId) {
        clauses.push('certificateId = ?');
        params.push(query.certificateId);
    }
    if (query.reporterEmail) {
        clauses.push('reporterEmail = ?');
        params.push(query.reporterEmail);
    }

    if (clauses.length > 0) {
        sql += ' WHERE ' + clauses.join(' AND ');
    }

    sql += ' ORDER BY createdAt DESC';
    const rows = await dbAll(sql, params);
    return rows.map(r => new FraudReport(r));
};

module.exports = { User, Certificate, Feedback, ActivityLog, SystemSettings, CertificateRequest, VerificationHistory, FraudReport };
