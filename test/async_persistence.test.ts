import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';

describe('Async Persistence Failure Safety', () => {
  let server: any;
  let baseUrl: string;
  let adminTokenOrg1: string;

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

    const resAdmin = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
    });
    adminTokenOrg1 = (await resAdmin.json()).token;
  });

  after(() => {
    server.close();
  });

  it('safely rejects and skips memory update when PostgreSQL fails', async () => {
    // 1. Hook the DB persistence to simulate a failure
    const originalPersist = (db as any).persistAttendanceSessionToPostgres;
    let persistCalled = false;
    (db as any).persistAttendanceSessionToPostgres = async (session: any) => {
      persistCalled = true;
      await new Promise(r => setTimeout(r, 10)); // simulate network delay
      throw new Error('SIMULATED_DB_ERROR');
    };

    // 2. Call the API
    const res = await fetch(`${baseUrl}/api/v1/attendance/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminTokenOrg1}`,
      },
      body: JSON.stringify({
        classroomId: 'class_horizon_10a',
        title: 'Async Failure Test Session',
      }),
    });

    // 3. Verify the HTTP response is NOT 2xx
    assert.strictEqual(res.status, 500);
    const body = await res.json();
    assert.strictEqual(body.success, false);

    // 4. Verify memory does not contain the ghost session
    // We search the entire map for 'Async Failure Test Session'
    const allSessions = Array.from((db as any).attendanceSessions.values());
    const ghost = allSessions.find((s: any) => s.title === 'Async Failure Test Session');
    assert.ok(!ghost, 'Ghost session was saved to memory despite DB failure');
    assert.ok(persistCalled, 'Persistence method was not called');

    // Restore
    (db as any).persistAttendanceSessionToPostgres = originalPersist;
  });
});
