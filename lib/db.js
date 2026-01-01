// Database connection for Vercel deployment
// Note: SQLite won't work on Vercel, so we need a hosted database

import mysql from 'mysql2/promise';

let dbConnection = null;

export async function connectDB() {
  try {
    if (dbConnection) {
      return true; // Already connected
    }

    const DB_TYPE = process.env.DB_TYPE || 'mysql';

    if (DB_TYPE === 'mysql' || DB_TYPE === 'mariadb') {
      // Use hosted MySQL/MariaDB
      const connectionConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'certificate_db',
        port: process.env.DB_PORT || 3306,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
      };

      dbConnection = await mysql.createConnection(connectionConfig);
      console.log('✅ Connected to hosted MySQL/MariaDB database');
      return true;
    } else {
      // Fallback or development mode
      console.warn('⚠️ SQLite not supported on Vercel. Please configure a hosted database.');
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function getDB() {
  if (!dbConnection) {
    await connectDB();
  }
  return dbConnection;
}

export async function closeDB() {
  if (dbConnection) {
    await dbConnection.end();
    dbConnection = null;
  }
}

// Database models (simplified for Vercel deployment)
export class User {
  static async findOne(query) {
    const db = await getDB();
    if (!db) throw new Error('Database not connected');

    const { email, walletAddress, id } = query;
    let sql, params;

    if (email) {
      sql = 'SELECT * FROM users WHERE email = ?';
      params = [email];
    } else if (walletAddress) {
      sql = 'SELECT * FROM users WHERE wallet_address = ?';
      params = [walletAddress];
    } else if (id) {
      sql = 'SELECT * FROM users WHERE id = ?';
      params = [id];
    } else {
      return null;
    }

    const [rows] = await db.execute(sql, params);
    return rows[0] || null;
  }

  static async findById(id) {
    return await this.findOne({ id });
  }

  static async countDocuments(query = {}) {
    const db = await getDB();
    if (!db) throw new Error('Database not connected');

    const { role } = query;
    let sql, params;

    if (role) {
      sql = 'SELECT COUNT(*) as count FROM users WHERE role = ?';
      params = [role];
    } else {
      sql = 'SELECT COUNT(*) as count FROM users';
      params = [];
    }

    const [rows] = await db.execute(sql, params);
    return rows[0].count;
  }

  static async find(query = {}) {
    const db = await getDB();
    if (!db) throw new Error('Database not connected');

    let sql = 'SELECT * FROM users';
    const params = [];

    if (query.role) {
      sql += ' WHERE role = ?';
      params.push(query.role);
    }

    const [rows] = await db.execute(sql, params);
    return rows;
  }

  // Instance methods
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const db = await getDB();
    if (!db) throw new Error('Database not connected');

    const data = {
      email: this.email,
      password: this.password,
      role: this.role,
      is_verified: this.isVerified || false,
      name: this.name || null,
      university: this.university || null,
      wallet_address: this.walletAddress || null,
      created_at: new Date(),
      last_login_at: this.lastLoginAt || null,
      password_history: this.passwordHistory || null,
      otp: this.otp || null,
      otp_expire: this.otpExpire || null,
      session_id: this.sessionId || null,
      refresh_token: this.refreshToken || null,
      is_banned: this.isBanned || false,
      google_id: this.googleId || null,
      requires_password_set: this.requiresPasswordSet || false,
      registration_number: this.registrationNumber || null,
      graduation_year: this.graduationYear || null,
      degree_type: this.degreeType || null,
      certificate_file: this.certificateFile || null,
      transcripts_file: this.transcriptsFile || null,
      id_passport_file: this.idPassportFile || null
    };

    if (this.id) {
      // Update
      const updateFields = Object.keys(data).filter(key => data[key] !== undefined);
      const setClause = updateFields.map(key => `${key} = ?`).join(', ');
      const values = updateFields.map(key => data[key]);
      values.push(this.id);

      await db.execute(`UPDATE users SET ${setClause} WHERE id = ?`, values);
    } else {
      // Insert
      const fields = Object.keys(data).filter(key => data[key] !== undefined);
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map(key => data[key]);

      const [result] = await db.execute(
        `INSERT INTO users (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );
      this.id = result.insertId;
    }
  }

  async comparePassword(password) {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.default.compare(password, this.password);
  }
}

// Add other model classes as needed...
