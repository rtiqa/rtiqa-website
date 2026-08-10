import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server';

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
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('GET /api/health returns 200 and status ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.deepStrictEqual(data, { status: 'ok' });
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
});
