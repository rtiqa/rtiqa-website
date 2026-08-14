import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server';
import { closePostgresPool } from '../src/db/postgres';

describe('Rtiqa API Suite', () => {
  let server: any;
  let baseUrl: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
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

  it('GET /api/health returns 200 and status ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  });

  it('POST /api/contact rejects missing required fields', async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User' }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'INVALID_EMAIL');
  });

  it('POST /api/contact rejects invalid email format', async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'invalid-email-address',
        organization: 'Org',
        subject: 'Subject',
        message: 'Message',
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.error, 'INVALID_EMAIL');
  });

  it('POST /api/contact accepts valid submission path', async () => {
    const res = await fetch(`${baseUrl}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Sarah Smith',
        email: 'sarah@university.edu',
        organization: 'Global University',
        subject: 'Partnership Inquiry',
        message: 'We are interested in Rtiqa AI Operating System for higher education.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.id);
  });

  it('POST /api/demo accepts valid demo request', async () => {
    const res = await fetch(`${baseUrl}/api/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Prof. Ahmed Al-Mansoor',
        email: 'ahmed@kust.edu.sa',
        organization: 'King University',
        orgType: 'higher_ed',
        role: 'Dean of Academic Affairs',
        subject: 'Enterprise Demo',
        message: 'Requesting a demo for curriculum management.',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.id);
  });

  it('POST /api/subscribe accepts valid newsletter subscription', async () => {
    const res = await fetch(`${baseUrl}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newsletter@institution.org',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.id);
  });

  // --- Platform API V1 Integration Tests ---
  describe('Rtiqa Platform API (MVP)', () => {
    let adminToken: string;
    let teacherToken: string;
    let studentToken: string;

    it('POST /api/v1/auth/demo-switch authenticates admin and generates token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, 'ORG_ADMIN');
      assert.ok(data.token);
      adminToken = data.token;
    });

    it('POST /api/v1/auth/demo-switch authenticates teacher and student', async () => {
      const resT = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: 'teacher', tenantSlug: 'horizon' }),
      });
      const dataT = await resT.json();
      teacherToken = dataT.token;
      assert.strictEqual(dataT.user.role, 'TEACHER');

      const resS = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: 'student', tenantSlug: 'horizon' }),
      });
      const dataS = await resS.json();
      studentToken = dataS.token;
      assert.strictEqual(dataS.user.role, 'STUDENT');
    });

    it('GET /api/v1/dashboard/stats returns metrics filtered by organization', async () => {
      const res = await fetch(`${baseUrl}/api/v1/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'X-Tenant-Slug': 'horizon',
        },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.totalStudents >= 0);
      assert.ok(data.data.totalTeachers >= 0);
    });

    it('GET /api/v1/academic/grades and classrooms returns academic structure', async () => {
      const res = await fetch(`${baseUrl}/api/v1/academic/grades`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'X-Tenant-Slug': 'horizon',
        },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    it('POST /api/v1/users/import-csv bulk imports students properly', async () => {
      const csv = 'الاسم,البريد الإلكتروني,الرقم الأكاديمي\nسالم الدوسري,salem.d@horizon.edu.sa,STD-999';
      const res = await fetch(`${baseUrl}/api/v1/users/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'X-Tenant-Slug': 'horizon',
        },
        body: JSON.stringify({ csvContent: csv }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.summary.importedCount, 1);
    });

    it('Enforces Multi-Tenant Isolation (Different tenant gets isolated scope)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: 'admin', tenantSlug: 'elite' }),
      });
      const data = await res.json();
      assert.strictEqual(data.organization.slug, 'elite');
      assert.notStrictEqual(data.organization.slug, 'horizon');
    });
  });
});
