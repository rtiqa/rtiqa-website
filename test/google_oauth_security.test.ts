import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { closePostgresPool } from '../src/db/postgres.ts';

describe('Google OAuth Identity & Organization Separation Security Test Suite', () => {
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

  // Helper to create mock Google ID token JWT
  function createMockGoogleToken(profile: {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  }) {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        ...profile,
        email_verified: profile.email_verified ?? true,
        aud: 'mock-google-client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64url');
    return `${header}.${payload}.mockSignature`;
  }

  // =========================================================================
  // SCENARIO 1: Existing School User Logging In with Google
  // =========================================================================
  describe('Scenario 1: Existing School User logs in via Google OAuth', () => {
    it('links Google identity without creating duplicate user and preserves existing memberships and roles', async () => {
      // Existing teacher in Horizon school
      const teacherBefore = db.findUserByEmail('teacher@horizon.edu.sa');
      assert.ok(teacherBefore);
      assert.strictEqual(teacherBefore.role, 'TEACHER');
      assert.strictEqual(teacherBefore.organizationId, 'org_horizon_001');

      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_teacher_123',
        email: 'teacher@horizon.edu.sa',
        name: 'أ. سارة المعلمة',
        picture: 'https://lh3.googleusercontent.com/teacher.png',
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'AUTHENTICATED');
      assert.strictEqual(data.requiresOnboarding, false);
      assert.strictEqual(data.user.id, teacherBefore.id);
      assert.strictEqual(data.user.role, 'TEACHER');
      assert.strictEqual(data.user.organizationId, 'org_horizon_001');
      assert.strictEqual(data.organization?.id, 'org_horizon_001');
      assert.ok(data.user.authProviders.includes('google'));
      assert.strictEqual(data.user.googleId, 'google_sub_teacher_123');

      // Verify DB user
      const teacherAfter = db.getUserById(teacherBefore.id)!;
      assert.strictEqual(teacherAfter.role, 'TEACHER');
      assert.strictEqual(teacherAfter.organizationId, 'org_horizon_001');
    });
  });

  // =========================================================================
  // SCENARIO 2: Brand New Google User (No Existing School or Membership)
  // =========================================================================
  describe('Scenario 2: Brand New External Google User logs in via Google OAuth', () => {
    it('creates pure User Identity with role PENDING and NO organization membership or access', async () => {
      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_brand_new_999',
        email: 'external.person@gmail.com',
        name: 'شخص خارجي جديد',
        picture: 'https://lh3.googleusercontent.com/external.png',
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'PENDING_ONBOARDING');
      assert.strictEqual(data.requiresOnboarding, true);
      assert.strictEqual(data.organization, null);
      assert.strictEqual(data.user.role, 'PENDING');
      assert.strictEqual(data.user.organizationId, undefined);
      assert.strictEqual(data.user.email, 'external.person@gmail.com');
      assert.strictEqual(data.user.memberships.length, 0);

      const token = data.token;
      assert.ok(token);

      // Verify that this new user CANNOT access Horizon or Elite school protected data
      const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const meData = await meRes.json();
      assert.strictEqual(meRes.status, 200);
      assert.strictEqual(meData.user.role, 'PENDING');
      assert.strictEqual(meData.organization, undefined);

      // Verify that calling a tenant-scoped endpoint returns 403
      const usersListRes = await fetch(`${baseUrl}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.strictEqual(usersListRes.status, 403);
    });
  });

  // =========================================================================
  // SCENARIO 3: New Google User Accepting School Invitation
  // =========================================================================
  describe('Scenario 3: Google User with an active Invitation', () => {
    it('automatically claims invitation if one was issued for their email address', async () => {
      // First, create an invitation for new teacher
      const inviteCode = 'INV-GOOGLE-001';
      db.createInvitation({
        organizationId: 'org_horizon_001',
        email: 'new.math.teacher@gmail.com',
        role: 'TEACHER',
        inviteCode,
        fullName: 'أستاذ الرياضيات الجديد',
        teacherSpecialization: 'الرياضيات المتقدمة',
        createdBy: 'usr_admin_001',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_math_teacher',
        email: 'new.math.teacher@gmail.com',
        name: 'أستاذ الرياضيات الجديد',
      });

      const res = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });

      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'AUTHENTICATED');
      assert.strictEqual(data.requiresOnboarding, false);
      assert.strictEqual(data.user.role, 'TEACHER');
      assert.strictEqual(data.user.organizationId, 'org_horizon_001');
      assert.strictEqual(data.organization?.id, 'org_horizon_001');
      assert.strictEqual(data.user.teacherSpecialization, 'الرياضيات المتقدمة');

      // Check that the invitation is marked as used
      const inv = db.getInvitationByCode(inviteCode);
      assert.strictEqual(inv?.isUsed, true);
    });

    it('allows a PENDING Google user to join a school by providing an invite code via /join-school', async () => {
      // 1. Google login as pending user
      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_student_invitee',
        email: 'invited.student@gmail.com',
        name: 'طالب بدعوة',
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });
      const loginData = await loginRes.json();
      const token = loginData.token;
      assert.strictEqual(loginData.user.role, 'PENDING');

      // 2. School admin generates an invitation code
      const inviteCode = 'INV-STD-JOIN-777';
      db.createInvitation({
        organizationId: 'org_horizon_001',
        email: 'invited.student@gmail.com',
        role: 'STUDENT',
        inviteCode,
        fullName: 'طالب بدعوة',
        createdBy: 'usr_admin_001',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      // 3. Authenticated user joins school with code
      const joinRes = await fetch(`${baseUrl}/api/v1/auth/join-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode }),
      });

      const joinData = await joinRes.json();
      assert.strictEqual(joinRes.status, 200);
      assert.strictEqual(joinData.success, true);
      assert.strictEqual(joinData.user.role, 'STUDENT');
      assert.strictEqual(joinData.user.organizationId, 'org_horizon_001');
      assert.strictEqual(joinData.organization?.id, 'org_horizon_001');
    });

    it('rejects joining school if invitation code is expired or invalid', async () => {
      // 1. Google login as pending user
      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_expired_invitee',
        email: 'expired.invitee@gmail.com',
        name: 'طالب بدعوة منتهية',
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });
      const loginData = await loginRes.json();
      const token = loginData.token;

      // 2. Create expired invitation
      const expiredCode = 'INV-EXP-999';
      db.createInvitation({
        organizationId: 'org_horizon_001',
        email: 'expired.invitee@gmail.com',
        role: 'STUDENT',
        inviteCode: expiredCode,
        createdBy: 'usr_admin_001',
        expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      });

      // 3. Try to join
      const joinRes = await fetch(`${baseUrl}/api/v1/auth/join-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: expiredCode }),
      });
      assert.strictEqual(joinRes.status, 400);
      const joinData = await joinRes.json();
      assert.strictEqual(joinData.error, 'EXPIRED');
    });

    it('rejects joining school with non-existent invite code', async () => {
      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_invalid_invitee',
        email: 'invalid.code@gmail.com',
        name: 'طالب بكود وهمي',
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });
      const loginData = await loginRes.json();
      const token = loginData.token;

      const joinRes = await fetch(`${baseUrl}/api/v1/auth/join-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: 'NON-EXISTENT-CODE-123' }),
      });
      assert.strictEqual(joinRes.status, 404);
      const joinData = await joinRes.json();
      assert.strictEqual(joinData.error, 'INVALID_CODE');
    });
  });

  // =========================================================================
  // SCENARIO 4: PENDING Google User Registering a Brand New School
  // =========================================================================
  describe('Scenario 4: Authenticated Google User creates a new school', () => {
    it('creates a new school and promotes the user to ORG_ADMIN of that school', async () => {
      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_future_principal',
        email: 'founder@newacademy.edu.sa',
        name: 'أ. عبد الرحمن المؤسس',
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });
      const loginData = await loginRes.json();
      const token = loginData.token;

      // Register new school
      const schoolRes = await fetch(`${baseUrl}/api/v1/auth/register-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolName: 'أكاديمية المستقبل الأهلية',
          slug: 'future-academy',
          adminName: 'أ. عبد الرحمن المؤسس',
          adminEmail: 'founder@newacademy.edu.sa',
        }),
      });

      const schoolData = await schoolRes.json();
      assert.strictEqual(schoolRes.status, 200);
      assert.strictEqual(schoolData.success, true);
      assert.strictEqual(schoolData.organization.slug, 'future-academy');
      assert.strictEqual(schoolData.user.role, 'ORG_ADMIN');
      assert.strictEqual(schoolData.user.organizationId, schoolData.organization.id);
      assert.ok(schoolData.user.memberships.some((m: any) => m.organizationId === schoolData.organization.id && m.role === 'ORG_ADMIN'));
    });
  });

  // =========================================================================
  // SCENARIO 5: Comprehensive Tenant API Isolation for PENDING users
  // =========================================================================
  describe('Scenario 5: PENDING User Tenant Isolation across all Core Endpoints', () => {
    it('strictly forbids PENDING users from accessing any tenant academic data', async () => {
      const mockJwt = createMockGoogleToken({
        sub: 'google_sub_unassigned_guest',
        email: 'unassigned.guest@gmail.com',
        name: 'مستخدم بلا مؤسسة',
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/google/verify-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: mockJwt }),
      });
      const loginData = await loginRes.json();
      const pendingToken = loginData.token;

      const endpointsToTest = [
        '/api/v1/academic/years',
        '/api/v1/users',
        '/api/v1/courses',
        '/api/v1/lessons',
        '/api/v1/assignments',
        '/api/v1/attendance',
        '/api/v1/gradebook',
        '/api/v1/dashboard/stats',
      ];

      for (const ep of endpointsToTest) {
        const res = await fetch(`${baseUrl}${ep}`, {
          headers: { Authorization: `Bearer ${pendingToken}` },
        });
        assert.strictEqual(res.status, 403, `Endpoint ${ep} must return 403 for PENDING users`);
      }
    });
  });
});
