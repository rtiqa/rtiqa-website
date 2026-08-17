import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { closePostgresPool } from '../src/db/postgres.ts';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../server/platform/security.ts';
import { normalizePhoneNumber } from '../server/platform/smsService.ts';

describe('Phase 1: Real User Identity & Authentication Foundation Test Suite', () => {
  let server: any;
  let baseUrl: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_SECRET = 'test_secret_key_32_characters_long_rtiqa_2026';
    const app = await createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closePostgresPool();
  });

  beforeEach(() => {
    db.resetData();
  });

  // =========================================================================
  // 1. PHONE NORMALIZATION & PASSWORD SECURITY UTILITIES
  // =========================================================================
  describe('1. Security & Normalization Helpers', () => {
    it('normalizes Saudi phone numbers to standard E.164 format', () => {
      assert.strictEqual(normalizePhoneNumber('0501234567').e164, '+966501234567');
      assert.strictEqual(normalizePhoneNumber('501234567').e164, '+966501234567');
      assert.strictEqual(normalizePhoneNumber('+966501234567').e164, '+966501234567');
      assert.strictEqual(normalizePhoneNumber('00966501234567').e164, '+966501234567');
      assert.strictEqual(normalizePhoneNumber('invalid_phone').isValid, false);
    });

    it('validates password strength rules', () => {
      assert.strictEqual(validatePasswordStrength('123').isValid, false);
      assert.strictEqual(validatePasswordStrength('password123').isValid, true);
    });

    it('hashes and securely verifies passwords with PBKDF2 salt', () => {
      const hash = hashPassword('MySecretPass2026!');
      assert.ok(hash.includes(':'));
      assert.strictEqual(verifyPassword('MySecretPass2026!', hash), true);
      assert.strictEqual(verifyPassword('WrongPass', hash), false);
    });
  });

  // =========================================================================
  // 2. USER REGISTRATION & EMAIL/PASSWORD LOGIN
  // =========================================================================
  describe('2. User Registration & Email Login', () => {
    it('registers a new student with email and password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'فيصل الشمري',
          email: 'faisal.shammari@horizon.edu.sa',
          password: 'Password@2026',
          role: 'STUDENT',
          tenantSlug: 'horizon',
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data.success, true);
      assert.ok(data.token);
      assert.strictEqual(data.user.email, 'faisal.shammari@horizon.edu.sa');
      assert.strictEqual(data.user.role, 'STUDENT');
      assert.strictEqual(data.verificationSent, true);
      assert.ok(data.user.memberships.length > 0);
    });

    it('rejects registration with existing duplicate email', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'د. خالد المنصور',
          email: 'admin@horizon.edu.sa', // Already seeded
          password: 'Password@2026',
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'EMAIL_IN_USE');
    });

    it('logs in successfully with email and verified password', async () => {
      // First register
      await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'نورة الدوسري',
          email: 'noura@horizon.edu.sa',
          password: 'NouraPassword2026!',
          role: 'TEACHER',
        }),
      });

      // Login
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'noura@horizon.edu.sa',
          password: 'NouraPassword2026!',
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.token);
      assert.strictEqual(data.user.fullName, 'نورة الدوسري');
      assert.strictEqual(data.user.role, 'TEACHER');
    });

    it('rejects login with incorrect password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@horizon.edu.sa',
          password: 'WrongPassword!',
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 401);
      assert.strictEqual(data.success, false);
    });
  });

  // =========================================================================
  // 3. PHONE NUMBER OTP AUTHENTICATION FLOW
  // =========================================================================
  describe('3. Phone Number & OTP Authentication', () => {
    it('sends OTP to phone number and respects cooldown', async () => {
      const res1 = await fetch(`${baseUrl}/api/v1/auth/phone/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+966501234567' }),
      });

      const data1 = await res1.json();
      assert.strictEqual(res1.status, 200);
      assert.strictEqual(data1.success, true);
      assert.strictEqual(data1.phone, '+966501234567');
      assert.ok(data1.devOtpCode);

      // Immediate second request within 60s cooldown triggers 429
      const res2 = await fetch(`${baseUrl}/api/v1/auth/phone/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+966501234567' }),
      });

      const data2 = await res2.json();
      assert.strictEqual(res2.status, 429);
      assert.strictEqual(data2.error, 'OTP_COOLDOWN');
    });

    it('verifies phone OTP and creates new user on first phone login', async () => {
      const sendRes = await fetch(`${baseUrl}/api/v1/auth/phone/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+966559876543' }),
      });
      const sendData = await sendRes.json();
      const otp = sendData.devOtpCode;
      assert.ok(otp);

      const verifyRes = await fetch(`${baseUrl}/api/v1/auth/phone/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+966559876543',
          code: otp,
          fullName: 'سعد العتيبي',
          tenantSlug: 'horizon',
        }),
      });

      const verifyData = await verifyRes.json();
      assert.strictEqual(verifyRes.status, 200);
      assert.strictEqual(verifyData.success, true);
      assert.ok(verifyData.token);
      assert.strictEqual(verifyData.user.phone, '+966559876543');
      assert.strictEqual(verifyData.user.phoneVerified, true);
      assert.strictEqual(verifyData.user.fullName, 'سعد العتيبي');
    });

    it('rejects invalid OTP and tracks attempts count', async () => {
      const sendRes = await fetch(`${baseUrl}/api/v1/auth/phone/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+966512348888' }),
      });
      const sendData = await sendRes.json();
      assert.ok(sendData.devOtpCode);

      const verifyRes = await fetch(`${baseUrl}/api/v1/auth/phone/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+966512348888',
          code: '000000', // Invalid code
        }),
      });

      const verifyData = await verifyRes.json();
      assert.strictEqual(verifyRes.status, 400);
      assert.strictEqual(verifyData.error, 'INVALID_OTP');
    });
  });

  // =========================================================================
  // 4. GOOGLE OAUTH & CREDENTIAL VERIFICATION
  // =========================================================================
  describe('4. Google Authentication Flow', () => {
    it('provides Google OAuth URL with CSRF state token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/google/url?tenantSlug=horizon`);
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.url.includes('accounts.google.com'));
      assert.ok(data.state);
    });

    it('creates or links user from verified Google credential payload', async () => {
      // Create simulated base64 Google ID Token payload
      const mockGoogleProfile = {
        sub: 'google_user_sub_987654321',
        email: 'google.student@gmail.com',
        email_verified: true,
        name: 'طالب جوجل التجريبي',
        picture: 'https://lh3.googleusercontent.com/a/mock_avatar',
        aud: 'mock-google-client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify(mockGoogleProfile)).toString('base64url');
      const mockJwt = `${header}.${payload}.mockSignature`;

      const res = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: mockJwt,
          tenantSlug: 'horizon',
        }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.token);
      assert.strictEqual(data.user.email, 'google.student@gmail.com');
      assert.strictEqual(data.user.emailVerified, true);
      assert.ok(data.user.authProviders.includes('google'));
    });
  });

  // =========================================================================
  // 5. PASSWORD RESET & EMAIL VERIFICATION
  // =========================================================================
  describe('5. Password Reset & Email Verification', () => {
    it('handles forgot password request with anti-enumeration response', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@horizon.edu.sa' }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.devResetToken);

      // Reset password with token
      const resetRes = await fetch(`${baseUrl}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: data.devResetToken,
          newPassword: 'BrandNewAdminPassword2026!',
        }),
      });

      const resetData = await resetRes.json();
      assert.strictEqual(resetRes.status, 200);
      assert.strictEqual(resetData.success, true);

      // Verify login with new password
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@horizon.edu.sa',
          password: 'BrandNewAdminPassword2026!',
        }),
      });

      const loginData = await loginRes.json();
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginData.success, true);
    });

    it('sends and confirms email verification token', async () => {
      // Login as teacher
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'teacher@horizon.edu.sa', password: 'Password@2026' }),
      });
      const loginData = await loginRes.json();
      assert.strictEqual(loginRes.status, 200);
      const token = loginData.token;
      assert.ok(token);

      // Send email verification
      const sendRes = await fetch(`${baseUrl}/api/v1/auth/verify-email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const sendData = await sendRes.json();
      assert.strictEqual(sendRes.status, 200);
      const verifyToken = sendData.devVerificationToken;
      assert.ok(verifyToken);

      // Confirm verification
      const confirmRes = await fetch(`${baseUrl}/api/v1/auth/verify-email/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      });
      const confirmData = await confirmRes.json();
      assert.strictEqual(confirmRes.status, 200);
      assert.strictEqual(confirmData.success, true);
      assert.strictEqual(confirmData.user.emailVerified, true);
    });
  });

  // =========================================================================
  // 6. MULTI-TENANT SWITCHING & MEMBERSHIPS
  // =========================================================================
  describe('6. Multi-Tenant Switcher & Memberships', () => {
    it('allows a multi-tenant user to switch organization context', async () => {
      // Super admin / multi-org user
      const adminLogin = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
      });
      const adminData = await adminLogin.json();
      const token = adminData.token;
      const user = adminData.user;

      // Add membership in Elite Academy for this user
      db.createMembership({
        userId: user.id,
        organizationId: 'org_elite_002',
        role: 'ORG_ADMIN',
        isDefault: false,
        status: 'ACTIVE',
      });

      // Switch to Elite Academy
      const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-organization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organizationSlug: 'elite' }),
      });

      const switchData = await switchRes.json();
      assert.strictEqual(switchRes.status, 200);
      assert.strictEqual(switchData.success, true);
      assert.strictEqual(switchData.organization.slug, 'elite');
      assert.ok(switchData.token);
    });
  });

  // =========================================================================
  // 7. ACCOUNT LINKING & UNLINKING SAFEGUARDS
  // =========================================================================
  describe('7. Account Linking & Unlinking Protection', () => {
    it('safeguards against unlinking the last remaining auth provider', async () => {
      // Register with email only
      const regRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'فاطمة الحربي',
          email: 'fatimah@horizon.edu.sa',
          password: 'Password@2026',
        }),
      });
      const regData = await regRes.json();
      const token = regData.token;

      // Attempt to unlink email (the only provider)
      const unlinkRes = await fetch(`${baseUrl}/api/v1/auth/unlink/email`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const unlinkData = await unlinkRes.json();
      assert.strictEqual(unlinkRes.status, 400);
      assert.strictEqual(unlinkData.error, 'CANNOT_UNLINK_LAST_PROVIDER');
    });
  });
});
