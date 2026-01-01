import { User } from '../../../lib/db';
import logger from '../../../lib/logger';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRE = "7d";

// Rate limiting (simplified for Vercel)
const rateLimitStore = new Map();

function checkRateLimit(identifier, maxRequests = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const key = `login_${identifier}`;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const record = rateLimitStore.get(key);

  if (now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Security event tracking (simplified)
const failedLoginAttempts = new Map();
const lockouts = new Map();

function handleFailedLogin(identifier, req) {
  const attempts = failedLoginAttempts.get(identifier) || 0;
  const newAttempts = attempts + 1;
  failedLoginAttempts.set(identifier, newAttempts);

  const maxAttempts = 5;
  const lockoutDuration = 30 * 60 * 1000; // 30 minutes

  if (newAttempts >= maxAttempts) {
    lockouts.set(identifier, Date.now() + lockoutDuration);
    return { locked: true, remainingAttempts: 0 };
  }

  return { locked: false, remainingAttempts: maxAttempts - newAttempts };
}

function handleSuccessfulLogin(identifier) {
  failedLoginAttempts.delete(identifier);
  lockouts.delete(identifier);
}

function isLockedOut(identifier) {
  const lockoutTime = lockouts.get(identifier);
  if (!lockoutTime) return false;

  if (Date.now() > lockoutTime) {
    lockouts.delete(identifier);
    failedLoginAttempts.delete(identifier);
    return false;
  }

  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, role } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      });
    }

    // Check lockout
    if (isLockedOut(email)) {
      return res.status(403).json({
        error: 'Account locked due to too many failed attempts',
        locked: true
      });
    }

    logger.info(`🔎 LOGIN request for: ${email}`);

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    logger.info('🔍 LOGIN: user found=', !!user);

    if (!user) {
      handleFailedLogin(email, req);
      return res.status(401).json({
        error: "Invalid credentials",
        remainingAttempts: rateLimit.remaining
      });
    }

    // Check role if specified
    if (role && user.role !== role && user.role !== 'admin') {
      return res.status(403).json({
        error: `Role mismatch: This account is registered as '${user.role}', but you are trying to login as '${role}'.`
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      handleFailedLogin(email, req);
      return res.status(401).json({
        error: "Invalid credentials",
        remainingAttempts: rateLimit.remaining
      });
    }

    // Reset failed login attempts on successful login
    handleSuccessfulLogin(email);

    // Update last login
    user.last_login_at = new Date().toISOString();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    // Set httpOnly cookie (in production, this would be handled by Vercel)
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
    ]);

    const responsePayload = {
      message: "Login successful.",
      accessToken: token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        university: user.university,
        organizationName: user.organization_name,
        registrationNumber: user.registration_number,
        isVerified: !!user.is_verified
      },
      otpRequired: false,
    };

    logger.info('sending login response payload:', JSON.stringify(responsePayload));
    res.json(responsePayload);

  } catch (error) {
    logger.error("❌ LOGIN error:", error);
    res.status(500).json({ error: error.message });
  }
}
