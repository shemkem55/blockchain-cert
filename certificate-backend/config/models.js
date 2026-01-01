const bcrypt = require('bcryptjs');
const { getPool } = require('./db');
const { randomBytes } = require('crypto');

// Helper to generate unique IDs
function makeId(prefix = '') {
    return prefix + Date.now().toString(36) + '-' + randomBytes(4).toString('hex');
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
                `INSERT INTO users (id, email, password, role, isVerified, otp, otpExpire, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id,
                    this.email,
                    this.password,
                    this.role || 'student',
                    this.isVerified ? 1 : 0,
                    this.otp || null,
                    this.otpExpire || null,
                    this.createdAt
                ]
            );
        } else {
            await pool.execute(
                `UPDATE users 
         SET email=?, password=?, role=?, isVerified=?, otp=?, otpExpire=? 
         WHERE id=?`,
                [
                    this.email,
                    this.password,
                    this.role,
                    this.isVerified ? 1 : 0,
                    this.otp || null,
                    this.otpExpire ? new Date(this.otpExpire) : null,
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
        return true; // Simplified - always return true
    }
}

// Static methods for User
User.findOne = async function (query) {
    const pool = getPool();
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
        clause = k === '_id' ? 'id = ?' : `\`${k}\` = ?`;
        params.push(query[k]);
    }

    const [rows] = await pool.execute(`SELECT * FROM users WHERE ${clause} LIMIT 1`, params);
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    row.isVerified = !!row.isVerified;
    row.otpExpire = row.otpExpire ? new Date(row.otpExpire) : null;
    row.createdAt = row.createdAt ? new Date(row.createdAt) : null;

    return new User(row);
};

User.findById = async function (id) {
    if (!id) return null;
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return null;

    const user = new User(rows[0]);
    user.select = function (sel) {
        if (sel === '-password') delete this.password;
        return this;
    };

    return createQueryObject(user);
};

User.find = async function (query = {}) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM users');
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
    const pool = getPool();
    const current = await User.findById(id);
    if (!current) return null;

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    return current;
};

User.countDocuments = async function (query = {}) {
    const pool = getPool();
    const keys = Object.keys(query);

    if (keys.length === 0) {
        const [rows] = await pool.execute('SELECT COUNT(*) as c FROM users');
        return rows[0].c;
    }

    const k = keys[0];
    const [rows] = await pool.execute(`SELECT COUNT(*) as c FROM users WHERE \`${k}\` = ?`, [query[k]]);
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
        if (this.revoked !== undefined) {
            this.revoked = !!this.revoked;
        }
    }

    async save() {
        const pool = getPool();
        const [exists] = await pool.execute('SELECT 1 FROM certificates WHERE id = ?', [this.id]);

        if (exists.length === 0) {
            await pool.execute(
                `INSERT INTO certificates 
         (id, name, course, year, revoked, issuedAt, issuedBy, transactionHash, tokenId, walletAddress, studentEmail) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    this.studentEmail || null
                ]
            );
        } else {
            await pool.execute(
                `UPDATE certificates 
         SET name=?, course=?, year=?, revoked=?, issuedAt=?, issuedBy=?, 
             transactionHash=?, tokenId=?, walletAddress=?, studentEmail=? 
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
                    this.id
                ]
            );
        }
        return this;
    }
}

Certificate.findOne = async function (query) {
    const pool = getPool();
    if (!query.id) return null;

    const [rows] = await pool.execute('SELECT * FROM certificates WHERE id = ? LIMIT 1', [query.id]);
    if (!rows.length) return null;

    const row = rows[0];
    row.revoked = !!row.revoked;
    return new Certificate(row);
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
    return rows.map(r => {
        r.revoked = !!r.revoked;
        return new Certificate(r);
    });
};

// ==================== FEEDBACK MODEL ====================
class Feedback {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const pool = getPool();
        this.id = makeId('f_');
        this.createdAt = new Date();

        await pool.execute(
            `INSERT INTO feedback (id, name, email, subject, feedbackType, message, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [this.id, this.name, this.email, this.subject, this.feedbackType, this.message, this.createdAt]
        );
        return this;
    }
}

// ==================== FRAUD REPORT MODEL ====================
class FraudReport {
    constructor(data) {
        Object.assign(this, data);
    }

    async save() {
        const pool = getPool();
        this.id = makeId('fraud_');
        this.createdAt = new Date();

        await pool.execute(
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

    static async find(query = {}) {
        const pool = getPool();
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
        const [rows] = await pool.execute(sql, params);
        return rows.map(r => new FraudReport(r));
    }
}

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

module.exports = { User, Certificate, Feedback, FraudReport };
