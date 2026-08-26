import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { generateToken } from '../server/platform/auth.ts';
import { hashPassword } from '../server/platform/security.ts';
import { closePostgresPool } from '../src/db/postgres.ts';

describe('Multi-Membership, Context Switching & JWT oid Validation Regression Test Suite', () => {
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

  // Requirement 1: User with School A only -> Can access A, rejected from B (403)
  it('1. User with membership in School A only: can access School A resources, but cannot switch or access School B', async () => {
    const orgA = db.getOrganizationBySlug('horizon')!;
    const orgB = db.getOrganizationBySlug('elite')!;

    // Create user only affiliated with School A
    const userA = db.createUser({
      email: 'teacher.onlyA@horizon.edu.sa',
      fullName: 'Teacher Only A',
      passwordHash: hashPassword('Password@2026'),
      organizationId: orgA.id,
      role: 'TEACHER',
      isActive: true,
    });

    const tokenA = generateToken(userA, orgA.id, 'TEACHER');

    // Access School A endpoint -> 200
    const meResA = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert.strictEqual(meResA.status, 200);
    const meDataA = await meResA.json();
    assert.strictEqual(meDataA.organization.id, orgA.id);
    assert.strictEqual(meDataA.activeRole, 'TEACHER');

    // Attempt to switch to School B where user has no membership -> 403
    const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ organizationId: orgB.id }),
    });
    assert.strictEqual(switchRes.status, 403);
    const switchData = await switchRes.json();
    assert.strictEqual(switchData.error, 'NO_MEMBERSHIP_IN_ORG');
  });

  // Requirement 2 & 3: User with A + B -> Can switch from A to B, and all subsequent requests use B
  it('2 & 3. User with A + B memberships: switches from A to B, and subsequent requests execute within B context with no 401', async () => {
    const orgA = db.getOrganizationBySlug('horizon')!;
    const orgB = db.getOrganizationBySlug('elite')!;

    // User created with base organizationId = School A
    const dualUser = db.createUser({
      email: 'dual.member@horizon.edu.sa',
      fullName: 'Dual Member User',
      passwordHash: hashPassword('Password@2026'),
      organizationId: orgA.id,
      role: 'TEACHER',
      isActive: true,
    });

    // Add explicit membership in School B as PARENT
    const memB = db.addMembership({
      userId: dualUser.id,
      organizationId: orgB.id,
      role: 'PARENT',
      status: 'ACTIVE',
      isDefault: false,
    });

    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'dual.member@horizon.edu.sa',
        password: 'Password@2026',
      }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token);

    // Switch context to School B
    const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-context`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginData.token}`,
      },
      body: JSON.stringify({ membershipId: memB.id }),
    });
    assert.strictEqual(switchRes.status, 200);
    const switchData = await switchRes.json();
    assert.strictEqual(switchData.activeContext.organizationId, orgB.id);
    assert.strictEqual(switchData.activeRole, 'PARENT');
    const tokenB = switchData.token;
    assert.ok(tokenB);

    // Subsequent request using tokenB against /auth/me MUST return 200 (NOT 401) and point to School B
    const meResB = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert.strictEqual(meResB.status, 200);
    const meDataB = await meResB.json();
    assert.strictEqual(meDataB.organization.id, orgB.id);
    assert.strictEqual(meDataB.activeContext.organizationId, orgB.id);
    assert.strictEqual(meDataB.activeRole, 'PARENT');
  });

  // Requirement 4: Role in B does not inherit role from A
  it('4. Role isolation: Role in School B does not inherit permissions or role from School A', async () => {
    const orgA = db.getOrganizationBySlug('horizon')!;
    const orgB = db.getOrganizationBySlug('elite')!;

    const user = db.createUser({
      email: 'admin.in.a.parent.in.b@rtiqa.com',
      fullName: 'Admin in A and Parent in B',
      organizationId: orgA.id,
      role: 'ORG_ADMIN',
      isActive: true,
    });

    const memB = db.addMembership({
      userId: user.id,
      organizationId: orgB.id,
      role: 'PARENT',
      status: 'ACTIVE',
      isDefault: false,
    });

    // Token for School B
    const tokenB = generateToken(user, orgB.id, 'PARENT', memB.id, 'ORGANIZATION');

    // Attempt an admin-only action in School B (creating an invitation)
    const inviteRes = await fetch(`${baseUrl}/api/v1/auth/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        email: 'new.invite@elite.edu.sa',
        role: 'TEACHER',
      }),
    });

    // Must be 403 FORBIDDEN because in School B the user is PARENT, not ORG_ADMIN
    assert.strictEqual(inviteRes.status, 403);
    const inviteData = await inviteRes.json();
    assert.strictEqual(inviteData.error, 'FORBIDDEN');
  });

  // Requirement 5: Attempting to forge oid manually to an org where user has no membership -> 403 on protected routes
  it('5. Forgery prevention: Forged JWT oid to an unauthorized org falls back to GUEST/PERSONAL and receives 403 on org routes', async () => {
    const orgA = db.getOrganizationBySlug('horizon')!;
    const orgB = db.getOrganizationBySlug('elite')!;

    // User only in School A
    const userOnlyA = db.createUser({
      email: 'student.onlyA@horizon.edu.sa',
      fullName: 'Student Only A',
      organizationId: orgA.id,
      role: 'STUDENT',
      isActive: true,
    });

    // Manually construct/sign a token with forged oid = School B
    const forgedToken = generateToken(userOnlyA, orgB.id, 'ORG_ADMIN');

    // /me shows that the user was demoted to GUEST/PERSONAL without School B access
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.activeRole, 'GUEST');
    assert.ok(!meData.organization);

    // Attempting to access an org-protected endpoint with forged token -> 403
    const protectedRes = await fetch(`${baseUrl}/api/v1/academic/years`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.strictEqual(protectedRes.status, 403);
    const protectedData = await protectedRes.json();
    assert.strictEqual(protectedData.error, 'NO_ORGANIZATION_MEMBERSHIP');
  });

  // Requirement 6: Logout and Login does not leak prior context
  it('6. Logout and Login cycle does not leak prior switched context', async () => {
    const orgA = db.getOrganizationBySlug('horizon')!;
    const orgB = db.getOrganizationBySlug('elite')!;

    const user = db.createUser({
      email: 'context.cycle@horizon.edu.sa',
      fullName: 'Context Cycle User',
      passwordHash: hashPassword('Password@2026'),
      organizationId: orgA.id,
      role: 'TEACHER',
      isActive: true,
    });

    db.addMembership({
      userId: user.id,
      organizationId: orgB.id,
      role: 'STUDENT',
      status: 'ACTIVE',
      isDefault: false,
    });

    // 1. Login
    const login1 = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'context.cycle@horizon.edu.sa',
        password: 'Password@2026',
      }),
    });
    const login1Data = await login1.json();

    // 2. Switch to Org B
    const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${login1Data.token}`,
      },
      body: JSON.stringify({ organizationId: orgB.id }),
    });
    const switchData = await switchRes.json();
    assert.strictEqual(switchData.activeContext.organizationId, orgB.id);

    // 3. Logout
    const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${switchData.token}` },
    });
    assert.strictEqual(logoutRes.status, 200);

    // 4. Fresh login yields default organization A
    const login2 = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'context.cycle@horizon.edu.sa',
        password: 'Password@2026',
      }),
    });
    const login2Data = await login2.json();
    assert.strictEqual(login2Data.user.organizationId, orgA.id);
  });

  // Requirement 7: SUPER_ADMIN is unaffected
  it('7. SUPER_ADMIN is unaffected and can operate across any organization', async () => {
    const orgA = db.getOrganizationBySlug('horizon')!;
    const orgB = db.getOrganizationBySlug('elite')!;

    const superAdmin = db.createUser({
      email: 'irtiqahq@gmail.com',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
    });

    // Token for Super Admin targeting School B (even without explicit membership)
    const superTokenB = generateToken(superAdmin, orgB.id, 'SUPER_ADMIN');

    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${superTokenB}` },
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.organization.id, orgB.id);
    assert.strictEqual(meData.activeRole, 'SUPER_ADMIN');

    // Super Admin can switch to School A
    const switchRes = await fetch(`${baseUrl}/api/v1/auth/switch-organization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superTokenB}`,
      },
      body: JSON.stringify({ organizationId: orgA.id }),
    });
    assert.strictEqual(switchRes.status, 200);
    const switchData = await switchRes.json();
    assert.strictEqual(switchData.organization.id, orgA.id);
    assert.strictEqual(switchData.activeRole, 'SUPER_ADMIN');
  });

  // Requirement 8: Tenant isolation remains strictly intact
  it('8. Tenant isolation remains strictly intact across dual-membership queries', async () => {
    const orgA = db.getOrganizationBySlug('horizon')!;
    const orgB = db.getOrganizationBySlug('elite')!;

    const dualUser = db.createUser({
      email: 'dual.academic@rtiqa.com',
      fullName: 'Dual Academic User',
      organizationId: orgA.id,
      role: 'ORG_ADMIN',
      isActive: true,
    });

    const memB = db.addMembership({
      userId: dualUser.id,
      organizationId: orgB.id,
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
      isDefault: false,
    });

    const tokenA = generateToken(dualUser, orgA.id, 'ORG_ADMIN');
    const tokenB = generateToken(dualUser, orgB.id, 'ORG_ADMIN', memB.id, 'ORGANIZATION');

    // Query academic years in context of A
    const resA = await fetch(`${baseUrl}/api/v1/academic/years`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataA = await resA.json();
    assert.strictEqual(resA.status, 200);
    assert.ok(dataA.data.length > 0);
    dataA.data.forEach((y: any) => {
      assert.strictEqual(y.organizationId, orgA.id);
    });

    // Query academic years in context of B
    const resB = await fetch(`${baseUrl}/api/v1/academic/years`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataB = await resB.json();
    assert.strictEqual(resB.status, 200);
    assert.ok(dataB.data.length > 0);
    dataB.data.forEach((y: any) => {
      assert.strictEqual(y.organizationId, orgB.id);
    });
  });
});
