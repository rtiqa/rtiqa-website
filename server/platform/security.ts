import crypto from 'crypto';
import express from 'express';

// --- Password Hashing with Salt (PBKDF2 SHA-512) ---
const HASH_ITERATIONS = 10000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = Buffer.from(derivedKey, 'hex');

    if (keyBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

// --- Secure Token, OTP & Code Generators ---
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateOtp(length = 6): string {
  // Cryptographically random 6-digit numeric OTP
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export function hashOtp(otp: string): string {
  const salt = crypto.randomBytes(8).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(otp.trim()).digest('hex');
  return `${salt}:${hash}`;
}

export function verifyOtp(otp: string, storedHash: string): boolean {
  try {
    if (!storedHash || !storedHash.includes(':')) return false;
    const [salt, expectedHash] = storedHash.split(':');
    const actualHash = crypto.createHmac('sha256', salt).update(otp.trim()).digest('hex');
    const bufA = Buffer.from(actualHash);
    const bufB = Buffer.from(expectedHash);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function generateInviteCode(): string {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RTIQA-${segment1}-${segment2}`;
}

export function validatePasswordStrength(password: unknown): { isValid: boolean; message?: string } {
  if (typeof password !== 'string') {
    return { isValid: false, message: 'كلمة المرور مطلوبة' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'كلمة المرور يجب أن لا تقل عن 8 أحرف وأرقام' };
  }
  return { isValid: true };
}

// --- Rate Limiter (In-Memory Sliding Window Bucket) ---
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const cutoff = now - 15 * 60 * 1000;
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => t > cutoff);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipInTests?: boolean;
}) {
  const { windowMs, maxRequests, message = 'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة لاحقاً', skipInTests = true } = options;

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (skipInTests && process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = rateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(key, record);
    }

    // Keep only timestamps within current window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfterSeconds,
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// --- Sanitization & Safe Validation Helpers ---
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}
