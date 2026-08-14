import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server';
import { db } from '../api/platform/db';
import { closePostgresPool } from '../src/db/postgres';

describe('Rtiqa Platform - QA, Security & RBAC Verification Suite', () => {
  let server: any;
  let baseUrl: string;

  let horizonAdminToken: string;
  let horizonTeacherToken: string;
  let horizonStudentToken: string;

  let eliteAdminToken: string;
  let eliteTeacherToken: string;
  let eliteStudentToken: string;

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

  beforeEach(async () => {
    db.resetData();

    // Authenticate Horizon School Personas
    const resHA = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
    });
    const dataHA = await resHA.json();
    horizonAdminToken = dataHA.token;

    const resHT = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'horizon' }),
    });
    const dataHT = await resHT.json();
    horizonTeacherToken = dataHT.token;

    const resHS = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'student', tenantSlug: 'horizon' }),
    });
    const dataHS = await resHS.json();
    horizonStudentToken = dataHS.token;

    // Authenticate Elite School Personas
    const resEA = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'elite' }),
    });
    const dataEA = await resEA.json();
    eliteAdminToken = dataEA.token;

    const resET = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'elite' }),
    });
    const dataET = await resET.json();
    eliteTeacherToken = dataET.token;

    const resES = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'student', tenantSlug: 'elite' }),
    });
    const dataES = await resES.json();
    eliteStudentToken = dataES.token;
  });

  // ==========================================
  // SECTION 1: AUTHENTICATION & TOKEN SECURITY
  // ==========================================
  describe('1. Authentication & Token Security', () => {
    it('Rejects login without email', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'EMAIL_REQUIRED');
    });

    it('Rejects login with invalid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'INVALID_CREDENTIALS');
    });

    it('Authenticates valid user and returns signed cryptographic token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@horizon.edu.sa', tenantSlug: 'horizon' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.token.includes('.'), 'Token must be HMAC signed with payload and signature');
      assert.strictEqual(data.user.email, 'admin@horizon.edu.sa');
      assert.strictEqual(data.organization.slug, 'horizon');
    });

    it('Rejects access to protected endpoint without token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'UNAUTHORIZED');
    });

    it('Rejects tampered token with altered signature', async () => {
      const tamperedToken = `${horizonAdminToken.split('.')[0]}.invalidSignatureTampered123`;
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${tamperedToken}` },
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'UNAUTHORIZED');
    });

    it('Rejects forged token with modified payload bytes', async () => {
      const parts = horizonAdminToken.split('.');
      const forgedPayload = Buffer.from(JSON.stringify({ uid: 'usr_horizon_admin', oid: 'org_horizon_001', role: 'SUPER_ADMIN', exp: Date.now() + 100000 })).toString('base64url');
      const forgedToken = `${forgedPayload}.${parts[1]}`;

      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${forgedToken}` },
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('GET /auth/me returns current user info when validly authenticated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${horizonAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.email, 'admin@horizon.edu.sa');
      assert.strictEqual(data.organization.slug, 'horizon');
    });
  });

  // ==========================================
  // SECTION 2: ROLE-BASED ACCESS CONTROL (RBAC)
  // ==========================================
  describe('2. Role-Based Access Control (RBAC)', () => {
    it('Admin can access users list and create a new user', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonAdminToken}`,
        },
        body: JSON.stringify({
          fullName: 'أستاذ كيمياء جديد',
          email: 'chem.teacher@horizon.edu.sa',
          role: 'TEACHER',
          teacherSpecialization: 'الكيمياء العامة',
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.email, 'chem.teacher@horizon.edu.sa');
    });

    it('Teacher CANNOT create new users (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonTeacherToken}`,
        },
        body: JSON.stringify({
          fullName: 'Unauthorized User',
          email: 'unauth@horizon.edu.sa',
          role: 'STUDENT',
        }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'FORBIDDEN');
    });

    it('Student CANNOT create courses (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonStudentToken}`,
        },
        body: JSON.stringify({
          title: 'Hacked Course',
          subjectId: 'sub_horizon_math',
          termId: 'term_horizon_t1',
          classroomId: 'class_horizon_10a',
        }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'FORBIDDEN');
    });

    it('Student CANNOT create lessons (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonStudentToken}`,
        },
        body: JSON.stringify({
          courseId: 'crs_horizon_math_10a',
          title: 'Hacked Lesson',
          contentHtml: '<p>Hacked</p>',
        }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'FORBIDDEN');
    });

    it('Student CANNOT view full classroom gradebook matrix (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/gradebook?courseId=crs_horizon_math_10a`, {
        headers: { Authorization: `Bearer ${horizonStudentToken}` },
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'FORBIDDEN');
    });

    it('Student accessing /gradebook/my-grades can only see their own grades', async () => {
      // Attempting to pass another student's ID
      const res = await fetch(`${baseUrl}/api/v1/gradebook/my-grades?studentId=usr_horizon_s_noura`, {
        headers: { Authorization: `Bearer ${horizonStudentToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      // Must return Omar's own data, not Noura's data!
      assert.strictEqual(data.data.student.id, 'usr_horizon_s_omar');
    });

    it('Student CANNOT grade assignments (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/assignments/submissions/sub_omar_01/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonStudentToken}`,
        },
        body: JSON.stringify({ score: 100, teacherFeedback: 'Self-graded' }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'FORBIDDEN');
    });

    it('Teacher CAN grade assignment and updates gradebook correctly', async () => {
      const res = await fetch(`${baseUrl}/api/v1/assignments/submissions/sub_omar_01/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonTeacherToken}`,
        },
        body: JSON.stringify({ score: 20, teacherFeedback: 'عمل رائع ومكتمل' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.score, 20);
    });

    it('Grading rejects negative scores', async () => {
      const res = await fetch(`${baseUrl}/api/v1/assignments/submissions/sub_omar_01/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonTeacherToken}`,
        },
        body: JSON.stringify({ score: -5 }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'VALID_SCORE_REQUIRED');
    });
  });

  // ==========================================
  // SECTION 3: MULTI-TENANT ISOLATION
  // ==========================================
  describe('3. Multi-Tenant Isolation', () => {
    it('Horizon admin CANNOT see Elite school users', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users`, {
        headers: { Authorization: `Bearer ${horizonAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      const eliteUserFound = data.data.some((u: any) => u.email.includes('elite.edu.sa'));
      assert.strictEqual(eliteUserFound, false, 'No Elite School users should leak into Horizon admin view');
    });

    it('Elite admin CANNOT see Horizon school users', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users`, {
        headers: { Authorization: `Bearer ${eliteAdminToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      const horizonUserFound = data.data.some((u: any) => u.email.includes('horizon.edu.sa'));
      assert.strictEqual(horizonUserFound, false, 'No Horizon School users should leak into Elite admin view');
    });

    it('Horizon token cannot mutate Elite school user', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/usr_elite_student`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonAdminToken}`,
        },
        body: JSON.stringify({ fullName: 'Cross-Tenant Tampered' }),
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'USER_NOT_FOUND');
    });

    it('Horizon token cannot delete Elite school user', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/usr_elite_student`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${horizonAdminToken}` },
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'USER_NOT_FOUND');
    });

    it('Authenticated user passing spoofed X-Tenant-Slug header is strictly bound to token tenant', async () => {
      // Horizon Admin attempts to pass 'X-Tenant-Slug: elite'
      const res = await fetch(`${baseUrl}/api/v1/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${horizonAdminToken}`,
          'X-Tenant-Slug': 'elite',
        },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      // Horizon has 4 students seeded, Elite has 1 student
      assert.strictEqual(data.data.totalStudents, 4, 'Stats must strictly reflect Horizon school');
    });

    it('Cannot create a course referencing a classroom in another tenant', async () => {
      const res = await fetch(`${baseUrl}/api/v1/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${eliteAdminToken}`,
        },
        body: JSON.stringify({
          title: 'Cross Tenant Course Attempt',
          subjectId: 'sub_horizon_math', // Belongs to Horizon
          termId: 'term_horizon_t1',     // Belongs to Horizon
          classroomId: 'class_horizon_10a', // Belongs to Horizon
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('Elite token CANNOT fetch lessons of Horizon course (404/Isolated)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/lessons/course/crs_horizon_math_10a`, {
        headers: { Authorization: `Bearer ${eliteTeacherToken}` },
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('Elite token CANNOT fetch assignments of Horizon course (404/Isolated)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/assignments?courseId=crs_horizon_math_10a`, {
        headers: { Authorization: `Bearer ${eliteTeacherToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.data.length, 0, 'Elite teacher must not receive Horizon assignments');
    });

    it('Elite token CANNOT fetch Horizon gradebook matrix', async () => {
      const res = await fetch(`${baseUrl}/api/v1/gradebook?courseId=crs_horizon_math_10a`, {
        headers: { Authorization: `Bearer ${eliteTeacherToken}` },
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('Elite token CANNOT fetch Horizon invitations or audit logs', async () => {
      const invRes = await fetch(`${baseUrl}/api/v1/auth/invitations`, {
        headers: { Authorization: `Bearer ${eliteAdminToken}` },
      });
      assert.strictEqual(invRes.status, 200);
      const invData = await invRes.json();
      const horizonInv = invData.data.some((inv: any) => inv.organizationId === 'org_horizon_001');
      assert.strictEqual(horizonInv, false, 'Elite school cannot see Horizon invitations');

      const auditRes = await fetch(`${baseUrl}/api/v1/dashboard/audit-logs`, {
        headers: { Authorization: `Bearer ${eliteAdminToken}` },
      });
      assert.strictEqual(auditRes.status, 200);
      const auditData = await auditRes.json();
      const horizonLogs = auditData.data.some((log: any) => log.organizationId === 'org_horizon_001');
      assert.strictEqual(horizonLogs, false, 'Elite school cannot see Horizon audit logs');
    });
  });

  // ==========================================
  // SECTION 4: CSV BULK IMPORT VALIDATION
  // ==========================================
  describe('4. CSV Bulk Import Security & Robustness', () => {
    it('Rejects completely empty CSV content', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonAdminToken}`,
        },
        body: JSON.stringify({ csvContent: '' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it('Rejects CSV with only header row', async () => {
      const res = await fetch(`${baseUrl}/api/v1/users/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonAdminToken}`,
        },
        body: JSON.stringify({ csvContent: 'الاسم,البريد الإلكتروني,الرقم الأكاديمي' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'EMPTY_CSV');
    });

    it('Handles valid rows, duplicate rows, and malformed emails gracefully', async () => {
      const csv = `الاسم,البريد الإلكتروني,الرقم الأكاديمي,رقم الهاتف
طارق الحربي,tariq.h@horizon.edu.sa,STD-801,0501112222
مستخدم بريد غير صالح,not-an-email,STD-802,0501112223
سعد مكرر في الملف,tariq.h@horizon.edu.sa,STD-803,0501112224
طالب موجود مسبقاً,student@horizon.edu.sa,STD-804,0501112225
ياسر القحطاني,yasser.q@horizon.edu.sa,STD-805,0501112226`;

      const res = await fetch(`${baseUrl}/api/v1/users/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonAdminToken}`,
        },
        body: JSON.stringify({ csvContent: csv, targetClassroomId: 'class_horizon_10a' }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.summary.totalRows, 5);
      assert.strictEqual(data.summary.importedCount, 2); // Tariq and Yasser
      assert.strictEqual(data.summary.failedCount, 3);   // Invalid email, duplicate in file, existing in DB
    });

    it('Rejects bulk import targeting a classroom from another tenant', async () => {
      const csv = `الاسم,البريد الإلكتروني,الرقم الأكاديمي\nسالم,salem.new@elite.edu.sa,ELT-999`;
      const res = await fetch(`${baseUrl}/api/v1/users/import-csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${eliteAdminToken}`,
        },
        body: JSON.stringify({ csvContent: csv, targetClassroomId: 'class_horizon_10a' }), // Horizon classroom
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, 'INVALID_CLASSROOM');
    });
  });

  // ==========================================
  // SECTION 5: ATTENDANCE & GRADEBOOK INTEGRITY
  // ==========================================
  describe('5. Attendance & Gradebook Operations', () => {
    it('Records batch roll-call attendance successfully', async () => {
      const today = '2026-09-15';
      const res = await fetch(`${baseUrl}/api/v1/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${horizonTeacherToken}`,
        },
        body: JSON.stringify({
          courseId: 'crs_horizon_math_10a',
          classroomId: 'class_horizon_10a',
          date: today,
          records: [
            { studentId: 'usr_horizon_s_omar', status: 'PRESENT' },
            { studentId: 'usr_horizon_s_noura', status: 'PRESENT' },
            { studentId: 'usr_horizon_s_faisal', status: 'ABSENT', notes: 'غياب بدون عذر' },
          ],
        }),
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.length, 3);
    });

    it('Student can fetch their personal attendance summary', async () => {
      const res = await fetch(`${baseUrl}/api/v1/attendance/summary`, {
        headers: { Authorization: `Bearer ${horizonStudentToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.attendanceRate >= 0);
    });

    it('Exports gradebook as CSV for teacher', async () => {
      const res = await fetch(`${baseUrl}/api/v1/gradebook/export-csv?courseId=crs_horizon_math_10a`, {
        headers: { Authorization: `Bearer ${horizonTeacherToken}` },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.csv.includes('Student Name'));
      assert.ok(data.csv.includes('عمر خالد السعيد'));
    });
  });
});
