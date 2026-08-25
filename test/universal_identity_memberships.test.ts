import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { closePostgresPool } from '../src/db/postgres.ts';

describe('Universal Identity & Contextual Memberships Architecture Test Suite', () => {
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

  describe('1. Universal User Identity & Personal Space Access', () => {
    it('allows a new user to register globally without school affiliation and access personal space', async () => {
      // Register global user without organization
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Tariq Global Learner',
          email: 'tariq.learner@rtiqa.com',
          password: 'Password@2026',
        }),
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token);

      // Verify token payload and /me endpoint
      const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meData = await meRes.json();
      assert.strictEqual(meData.success, true);
      assert.strictEqual(meData.user.email, 'tariq.learner@rtiqa.com');
    });

    it('allows switching explicitly to PERSONAL space context', async () => {
      // Login with school admin
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@horizon.edu.sa',
          password: 'Password@2026',
        }),
      });
      assert.strictEqual(loginRes.status, 200);
      const loginData = await loginRes.json();

      // Switch to PERSONAL context
      const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ contextType: 'PERSONAL' }),
      });

      assert.strictEqual(switchRes.status, 200);
      const switchData = await switchRes.json();
      assert.strictEqual(switchData.success, true);
      assert.strictEqual(switchData.activeContext.type, 'PERSONAL');
      assert.strictEqual(switchData.activeContext.isPersonal, true);
      assert.strictEqual(switchData.activeRole, 'GUEST');
    });
  });

  describe('2. Multi-Tenant Membership Verification & Strict Context Switching', () => {
    it('switches context safely via verified membershipId', async () => {
      // User with memberships across schools
      const user = db.findUserByEmail('teacher@horizon.edu.sa')!;
      const orgA = db.getOrganizationBySlug('horizon')!;
      const orgB = db.getOrganizationBySlug('elite')!;

      // Add membership for Teacher in Org A
      const memA = db.addMembership({
        userId: user.id,
        organizationId: orgA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
        isDefault: false,
      });

      // Add membership for same User as Parent in Org B
      const memB = db.addMembership({
        userId: user.id,
        organizationId: orgB.id,
        role: 'PARENT',
        status: 'ACTIVE',
        isDefault: false,
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'teacher@horizon.edu.sa',
          password: 'Password@2026',
        }),
      });
      const loginData = await loginRes.json();

      // 1. Switch to Org A as Teacher using memA.id
      const switchARes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ membershipId: memA.id }),
      });
      assert.strictEqual(switchARes.status, 200);
      const switchAData = await switchARes.json();
      assert.strictEqual(switchAData.activeContext.organizationId, orgA.id);
      assert.strictEqual(switchAData.activeContext.role, 'TEACHER');

      // 2. Switch to Org B as Parent using memB.id
      const switchBRes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${switchAData.token}`,
        },
        body: JSON.stringify({ membershipId: memB.id }),
      });
      assert.strictEqual(switchBRes.status, 200);
      const switchBData = await switchBRes.json();
      assert.strictEqual(switchBData.activeContext.organizationId, orgB.id);
      assert.strictEqual(switchBData.activeContext.role, 'PARENT');
    });

    it('rejects context switch to a membership belonging to another user (403)', async () => {
      const teacher = db.findUserByEmail('teacher@horizon.edu.sa')!;
      const student = db.findUserByEmail('student@horizon.edu.sa')!;
      const orgA = db.getOrganizationBySlug('horizon')!;

      const studentMem = db.addMembership({
        userId: student.id,
        organizationId: orgA.id,
        role: 'STUDENT',
        status: 'ACTIVE',
        isDefault: false,
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'teacher@horizon.edu.sa',
          password: 'Password@2026',
        }),
      });
      const loginData = await loginRes.json();

      // Teacher attempts to switch using student's membershipId
      const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ membershipId: studentMem.id }),
      });

      assert.strictEqual(switchRes.status, 403);
      const data = await switchRes.json();
      assert.strictEqual(data.error, 'INVALID_MEMBERSHIP');
    });

    it('allows a single user to hold both TEACHER and PARENT memberships within the SAME organization and enforces role-specific permissions per context', async () => {
      const orgA = db.getOrganizationBySlug('horizon')!;

      // Create a multi-role user
      const dualUser = db.createUser({
        email: 'fatima.dual@horizon.edu.sa',
        fullName: 'Fatima Teacher & Mother',
        passwordHash: '$2b$10$test_hash_fatima_2026',
        role: 'GUEST',
        isActive: true,
      });

      // Membership 1: TEACHER in Horizon
      const teacherMembership = db.addMembership({
        userId: dualUser.id,
        organizationId: orgA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
        isDefault: true,
      });

      // Membership 2: PARENT in Horizon
      const parentMembership = db.addMembership({
        userId: dualUser.id,
        organizationId: orgA.id,
        role: 'PARENT',
        status: 'ACTIVE',
        isDefault: false,
      });

      // Generate a base token for the user
      const baseToken = (await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Fatima Teacher & Mother',
          email: 'fatima.unique@horizon.edu.sa',
          password: 'Password@2026',
        }),
      }).then((r) => r.json())).token;

      // Add memberships to this registered user
      const registeredUser = db.findUserByEmail('fatima.unique@horizon.edu.sa')!;
      const memTeacher = db.addMembership({
        userId: registeredUser.id,
        organizationId: orgA.id,
        role: 'TEACHER',
        status: 'ACTIVE',
        isDefault: true,
      });
      const memParent = db.addMembership({
        userId: registeredUser.id,
        organizationId: orgA.id,
        role: 'PARENT',
        status: 'ACTIVE',
        isDefault: false,
      });

      // 1. Switch to TEACHER context in Horizon
      const switchTeacherRes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${baseToken}`,
        },
        body: JSON.stringify({ membershipId: memTeacher.id }),
      });
      assert.strictEqual(switchTeacherRes.status, 200);
      const teacherContextData = await switchTeacherRes.json();
      assert.strictEqual(teacherContextData.activeContext.role, 'TEACHER');
      assert.strictEqual(teacherContextData.activeContext.organizationId, orgA.id);

      // Verify TEACHER can access teacher-authorized endpoints (e.g. library resource creation)
      const teacherToken = teacherContextData.token;
      const teacherActionRes = await fetch(`${baseUrl}/api/v1/library/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({
          title: 'خطة درس الرياضيات للأسبوع الأول',
          resourceType: 'DOCUMENT',
          format: 'PDF',
          visibility: 'PUBLIC_SCHOOL',
        }),
      });
      assert.strictEqual(teacherActionRes.status, 201);

      // 2. Switch to PARENT context in Horizon
      const switchParentRes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`,
        },
        body: JSON.stringify({ membershipId: memParent.id }),
      });
      assert.strictEqual(switchParentRes.status, 200);
      const parentContextData = await switchParentRes.json();
      assert.strictEqual(parentContextData.activeContext.role, 'PARENT');
      assert.strictEqual(parentContextData.activeContext.organizationId, orgA.id);

      // Verify PARENT context CANNOT perform teacher-only mutations (returns 403)
      const parentToken = parentContextData.token;
      const parentForbiddenRes = await fetch(`${baseUrl}/api/v1/library/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parentToken}`,
        },
        body: JSON.stringify({
          title: 'محاولة نشر مورد كولي أمر',
          resourceType: 'DOCUMENT',
          format: 'PDF',
        }),
      });
      assert.strictEqual(parentForbiddenRes.status, 403);
    });

    it('rejects context switch when membership status is PENDING_APPROVAL (403)', async () => {
      const user = db.findUserByEmail('student@horizon.edu.sa')!;
      const orgB = db.getOrganizationBySlug('elite')!;

      const pendingMem = db.addMembership({
        userId: user.id,
        organizationId: orgB.id,
        role: 'STUDENT',
        status: 'PENDING_APPROVAL',
        isDefault: false,
      });

      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'student@horizon.edu.sa',
          password: 'Password@2026',
        }),
      });
      const loginData = await loginRes.json();

      const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ membershipId: pendingMem.id }),
      });

      assert.strictEqual(switchRes.status, 403);
      const data = await switchRes.json();
      assert.strictEqual(data.error, 'MEMBERSHIP_NOT_ACTIVE');
    });
  });

  describe('3. SIS Student Profile Decoupling & Parent Link Token Safety', () => {
    it('creates school-owned student profile and links safely via claim token', async () => {
      const orgA = db.getOrganizationBySlug('horizon')!;
      const profile = db.createStudentProfile({
        organizationId: orgA.id,
        studentIdNumber: 'STD-2026-999',
        firstName: 'Zaid',
        lastName: 'Student',
        fullName: 'Zaid SIS Student',
        status: 'ACTIVE',
        gender: 'MALE',
        claimTokenHash: 'secure_claim_hash_123',
        claimTokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      assert.strictEqual(profile.isClaimed, false);
      assert.strictEqual(profile.organizationId, orgA.id);

      // Claim student profile by new Rtiga user
      const user = db.findUserByEmail('student@horizon.edu.sa')!;
      const claimed = db.claimStudentProfile(profile.id, orgA.id, user.id);

      assert.ok(claimed);
      assert.strictEqual(claimed.isClaimed, true);
      assert.strictEqual(claimed.claimedByUserId, user.id);

      // Double claim is prevented
      const doubleClaim = db.claimStudentProfile(profile.id, orgA.id, 'another_user_id');
      assert.strictEqual(doubleClaim, undefined);
    });

    it('generates single-use, temporary parent link tokens without relying on national ID', async () => {
      const orgA = db.getOrganizationBySlug('horizon')!;
      const profile = db.createStudentProfile({
        organizationId: orgA.id,
        studentIdNumber: 'STD-2026-888',
        firstName: 'Lina',
        lastName: 'Student',
        fullName: 'Lina Parent Linked Student',
        status: 'ACTIVE',
        gender: 'FEMALE',
      });

      const parentToken = db.createParentLinkToken({
        organizationId: orgA.id,
        studentProfileId: profile.id,
        tokenHash: 'plt_token_hash_secure_456',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        relationship: 'MOTHER',
        createdBy: 'admin_user_id',
      });

      assert.strictEqual(parentToken.isUsed, false);

      // Lookup by hash
      const found = db.getParentLinkTokenByHash('plt_token_hash_secure_456');
      assert.ok(found);
      assert.strictEqual(found.studentProfileId, profile.id);

      // Mark token used
      const used = db.markParentLinkTokenUsed(found.id, 'parent_user_id_789');
      assert.ok(used);
      assert.strictEqual(used.isUsed, true);

      // Subsequent lookup by hash fails because token is used
      const expiredOrUsed = db.getParentLinkTokenByHash('plt_token_hash_secure_456');
      assert.strictEqual(expiredOrUsed, undefined);
    });
  });
});
