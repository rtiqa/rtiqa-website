import express from 'express';
import crypto from 'crypto';
import { db } from './db';
import { User, UserRole, Organization } from './types';

// Extended Express Request with Tenant and Auth Context
export interface PlatformRequest extends express.Request {
  user?: User;
  organization?: Organization;
}

// In-memory runtime ephemeral secret generated on the fly for non-production environments when AUTH_SECRET is not set
let devRuntimeSecret: string | null = null;

// Validate that AUTH_SECRET is configured in production environment (Fail-Fast)
export function assertProductionAuthSecret(): void {
  if (process.env.NODE_ENV === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.trim() === '')) {
    throw new Error(
      '[FATAL SECURITY ERROR] AUTH_SECRET environment variable is missing in production. A strong cryptographic secret must be provided via environment variables.'
    );
  }
}

// Retrieve the active signing secret from environment or ephemeral in-memory generator
export function getAuthSecret(): string {
  const envSecret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (envSecret && envSecret.trim() !== '') {
    return envSecret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[FATAL SECURITY ERROR] AUTH_SECRET environment variable is missing in production. A strong cryptographic secret must be provided via environment variables.'
    );
  }

  // In development/test mode without an explicit env variable, generate an ephemeral non-static random secret in RAM
  if (!devRuntimeSecret) {
    devRuntimeSecret = crypto.randomBytes(32).toString('hex');
  }
  return devRuntimeSecret;
}

interface TokenPayload {
  uid: string;
  oid: string;
  role: UserRole;
  email: string;
  exp: number;
}

// Generate cryptographically signed HMAC-SHA256 Token
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    uid: user.id,
    oid: user.organizationId,
    role: user.role,
    email: user.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };

  const secret = getAuthSecret();
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadEncoded)
    .digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

// Verify and decode HMAC-signed token
export function decodeAndVerifyToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadEncoded, providedSignature] = parts;
    const secret = getAuthSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadEncoded)
      .digest('base64url');

    // Constant-time signature comparison to prevent timing attacks
    const sigBufferA = Buffer.from(providedSignature);
    const sigBufferB = Buffer.from(expectedSignature);

    if (sigBufferA.length !== sigBufferB.length || !crypto.timingSafeEqual(sigBufferA, sigBufferB)) {
      return null;
    }

    const jsonStr = Buffer.from(payloadEncoded, 'base64url').toString('utf-8');
    const parsed: TokenPayload = JSON.parse(jsonStr);

    // Validate payload fields and expiry
    if (!parsed.uid || !parsed.oid || !parsed.role || !parsed.exp) {
      return null;
    }

    if (Date.now() > parsed.exp) {
      // Token expired
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

// Middleware: Extract tenant & auth state from headers and tokens
export const platformAuthMiddleware = (
  req: PlatformRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;
  const tenantHeader = (req.headers['x-tenant-id'] || req.headers['x-tenant-slug']) as string;

  // 1. If Bearer token provided
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = decodeAndVerifyToken(token);

    if (verified) {
      const user = db.getUserById(verified.uid, verified.oid);
      if (user && user.isActive) {
        req.user = user;
        // Tenant context is strictly bound to the authenticated user's organization!
        // Prevents header-spoofing across tenants.
        req.organization = db.getOrganizationById(user.organizationId);
        return next();
      }
    }
  }

  // 2. Unauthenticated request: Resolve tenant from header if supplied
  if (tenantHeader) {
    const org = db.getOrganizationById(tenantHeader) || db.getOrganizationBySlug(tenantHeader);
    if (org) {
      req.organization = org;
    }
  }

  // Default fallback for unauthenticated public preview landing
  if (!req.organization) {
    req.organization = db.getOrganizationBySlug('horizon');
  }

  next();
};

// Guard: Require authenticated user
export const requireAuth = (
  req: PlatformRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.user || !req.organization) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please sign in.',
    });
  }
  next();
};

// Guard: Require specific user roles
export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: PlatformRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Insufficient permissions for this resource.',
      });
    }

    next();
  };
};
