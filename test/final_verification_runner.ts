import { test, describe } from 'node:test';
import assert from 'node:assert';

const PROD_URL = 'https://rtiqa.com';

describe('Final Production & Local Authentication Verification', () => {
  let prodToken = '';

  test('PROD: Health & DB Connection', async () => {
    const res = await fetch(`${PROD_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.database?.connected, true);
    assert.strictEqual(data.database?.engine, 'POSTGRESQL');
    assert.ok(data.database?.version?.includes('PostgreSQL 17'));
  });

  test('PROD: Security Headers', async () => {
    const res = await fetch(`${PROD_URL}/api/health`);
    const h = res.headers;
    assert.ok(h.get('content-security-policy'));
    assert.ok(h.get('strict-transport-security'));
    assert.ok(h.get('x-content-type-options'));
    assert.ok(h.get('x-frame-options'));
    assert.ok(h.get('access-control-allow-headers'));
  });

  test('PROD: Login & JWT Issuance', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@horizon.edu.sa',
        password: 'Password@2026',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.strictEqual(data.user.email, 'admin@horizon.edu.sa');
    prodToken = data.token;
  });

  test('PROD: Invalid Password Rejection', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@horizon.edu.sa',
        password: 'BadPassword999!',
      }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  test('PROD: /api/v1/auth/me Session Validation', async () => {
    assert.ok(prodToken);
    const res = await fetch(`${PROD_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${prodToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, 'admin@horizon.edu.sa');
    assert.strictEqual(data.organization.id, 'org_horizon_001');
  });

  test('PROD: Anti-Enumeration Forgot Password', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
  });

  test('PROD: Academic Courses Query (RBAC + Tenant Isolation)', async () => {
    assert.ok(prodToken);
    const res = await fetch(`${PROD_URL}/api/v1/courses`, {
      headers: { Authorization: `Bearer ${prodToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.strictEqual(data.data[0].organizationId, 'org_horizon_001');
  });

  test('PROD: Academic Attendance Query', async () => {
    assert.ok(prodToken);
    const res = await fetch(`${PROD_URL}/api/v1/attendance?classroomId=class_horizon_10a`, {
      headers: { Authorization: `Bearer ${prodToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  test('PROD: Academic Gradebook Query', async () => {
    assert.ok(prodToken);
    const res = await fetch(`${PROD_URL}/api/v1/gradebook?courseId=crs_horizon_math_10a`, {
      headers: { Authorization: `Bearer ${prodToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data?.matrix));
  });

  test('PROD: AI Pedagogical Engine Endpoint', async () => {
    assert.ok(prodToken);
    const res = await fetch(`${PROD_URL}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${prodToken}`,
      },
      body: JSON.stringify({
        prompt: 'اشرح لي مبدأ أرخميدس بإيجاز',
        courseId: 'crs_horizon_phys_10a',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data?.text || data.data?.response);
  });
});
