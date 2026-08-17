import { test, describe } from 'node:test';
import assert from 'node:assert';

const PROD_URL = 'https://rtiqa.com';

describe('Production Live Verification - https://rtiqa.com', () => {
  let authToken = '';
  let authUser: any = null;

  test('PHASE 1: Production Deployment Status & Health', async () => {
    const res = await fetch(`${PROD_URL}/api/health`);
    assert.strictEqual(res.status, 200, 'Health endpoint must return 200');
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.service, 'rtiqa-api-gateway');
    assert.strictEqual(data.database?.connected, true);
    assert.strictEqual(data.database?.engine, 'POSTGRESQL');
    console.log('[PROD HEALTH CHECK]', data);
  });

  test('PHASE 2.1: Authentication - Supported Auth Providers', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/providers`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.emailPassword !== undefined);
    assert.ok(data.data.phoneOtp !== undefined);
    assert.ok(data.data.googleOAuth !== undefined);
    console.log('[PROD AUTH PROVIDERS]', data.data);
  });

  test('PHASE 2.2: Authentication - Login with verified credentials', async () => {
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
    assert.ok(data.user);
    assert.strictEqual(data.user.email, 'admin@horizon.edu.sa');
    authToken = data.token;
    authUser = data.user;
    console.log('[PROD LOGIN SUCCESS]', { userId: data.user.id, role: data.user.role, tenant: data.user.tenantSlug });
  });

  test('PHASE 2.3: Authentication - Rejection of invalid credentials', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@horizon.edu.sa',
        password: 'WrongPassword123!',
      }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.success, false);
  });

  test('PHASE 2.4: Authentication - Current User Session /api/v1/auth/me', async () => {
    assert.ok(authToken, 'Token required from login');
    const res = await fetch(`${PROD_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.email, 'admin@horizon.edu.sa');
    assert.ok(Array.isArray(data.data.identities), 'Identities array must be present');
    assert.ok(Array.isArray(data.data.memberships), 'Memberships array must be present');
    console.log('[PROD AUTH ME]', {
      email: data.data.email,
      identitiesCount: data.data.identities.length,
      membershipsCount: data.data.memberships.length,
    });
  });

  test('PHASE 2.5: Authentication - Anti-Enumeration Password Reset Request', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent-random-user-2026@rtiqa.com' }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.code, 'RESET_INITIATED');
  });

  test('PHASE 2.6: Authentication - Phone OTP Request & Rate Limit Handling', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/phone/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+966501112233' }),
    });
    // Can be 200 (OTP sent) or 429 (cooldown if recently called)
    assert.ok([200, 429].includes(res.status), `Expected 200 or 429, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.code === 'OTP_SENT' || data.error === 'COOLDOWN_ACTIVE');
    console.log('[PROD PHONE OTP]', data);
  });

  test('PHASE 2.7: Authentication - Google OAuth URL with CSRF state token', async () => {
    const res = await fetch(`${PROD_URL}/api/v1/auth/google/url`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.url.includes('accounts.google.com'));
    assert.ok(data.data.state);
  });

  test('PHASE 2.8: Multi-Tenant Organizations & Switch Context', async () => {
    assert.ok(authToken);
    const res = await fetch(`${PROD_URL}/api/v1/auth/organizations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    console.log('[PROD ORGANIZATIONS]', data.data);
  });

  test('PHASE 3: Security & Header Verification', async () => {
    const res = await fetch(`${PROD_URL}/api/health`);
    const headers = res.headers;
    
    // Check security headers
    assert.ok(headers.get('content-security-policy'), 'CSP header should be present');
    assert.ok(headers.get('strict-transport-security'), 'HSTS header should be present');
    assert.ok(headers.get('x-content-type-options'), 'X-Content-Type-Options header should be present');
    assert.ok(headers.get('x-frame-options'), 'X-Frame-Options header should be present');
    
    console.log('[PROD SECURITY HEADERS]', {
      csp: headers.get('content-security-policy') ? 'PRESENT' : 'MISSING',
      hsts: headers.get('strict-transport-security'),
      xContentTypeOptions: headers.get('x-content-type-options'),
      xFrameOptions: headers.get('x-frame-options'),
      cors: headers.get('access-control-allow-headers'),
    });
  });

  test('PHASE 5: Academic & Existing Endpoints Regression Check', async () => {
    assert.ok(authToken);
    
    // Check courses
    const coursesRes = await fetch(`${PROD_URL}/api/v1/courses`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(coursesRes.status, 200);
    const coursesData = await coursesRes.json();
    assert.strictEqual(coursesData.success, true);
    assert.ok(Array.isArray(coursesData.data));

    // Check attendance
    const attendanceRes = await fetch(`${PROD_URL}/api/v1/attendance`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(attendanceRes.status, 200);

    // Check gradebook
    const gradebookRes = await fetch(`${PROD_URL}/api/v1/gradebook`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(gradebookRes.status, 200);

    // Check AI Tutor endpoint
    const aiRes = await fetch(`${PROD_URL}/api/v1/ai/tutor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: 'مرحبا، ما هي قوانين نيوتن؟',
        subject: 'physics',
      }),
    });
    assert.strictEqual(aiRes.status, 200);
    const aiData = await aiRes.json();
    assert.strictEqual(aiData.success, true);
    assert.ok(aiData.data.response);

    console.log('[PROD REGRESSION PASS]', {
      coursesCount: coursesData.data.length,
      aiResponseLength: aiData.data.response.length,
    });
  });
});
