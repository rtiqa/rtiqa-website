import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { closePostgresPool } from '../src/db/postgres.ts';

describe('Phase 2.1: Academic Core & School Structure Foundation Test Suite', () => {
  let server: any;
  let baseUrl: string;
  let adminTokenOrg1: string;
  let adminTokenOrg2: string;
  let teacherTokenOrg1: string;
  let studentTokenOrg1: string;

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

  beforeEach(async () => {
    db.resetData();

    // Login Org 1 Admin (admin@horizon.edu.sa / Horizon Academy / org_horizon_main)
    const res1 = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
    });
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    adminTokenOrg1 = data1.token;

    // Login Teacher Org 1 (teacher@horizon.edu.sa)
    const resTeach = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'horizon' }),
    });
    const dataTeach = await resTeach.json();
    assert.strictEqual(resTeach.status, 200);
    teacherTokenOrg1 = dataTeach.token;

    // Login Student Org 1 (student@horizon.edu.sa)
    const resStud = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'student', tenantSlug: 'horizon' }),
    });
    const dataStud = await resStud.json();
    assert.strictEqual(resStud.status, 200);
    studentTokenOrg1 = dataStud.token;

    // Register a second organization & admin for multi-tenant isolation testing
    const res2 = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'elite' }),
    });
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    adminTokenOrg2 = data2.token;
  });

  // =========================================================================
  // 1. ACADEMIC YEARS & TERMS
  // =========================================================================
  describe('1. Academic Years & Terms Management', () => {
    it('creates, retrieves, updates, and deletes an academic year', async () => {
      // 1. Create
      const createRes = await fetch(`${baseUrl}/api/v1/academic/years`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          name: '2026-2027 Academic Year',
          startDate: '2026-09-01',
          endDate: '2027-06-30',
          isCurrent: true,
        }),
      });
      assert.strictEqual(createRes.status, 201);
      const createData = await createRes.json();
      assert.strictEqual(createData.success, true);
      assert.strictEqual(createData.data.name, '2026-2027 Academic Year');
      const yearId = createData.data.id;

      // 2. Get list
      const getRes = await fetch(`${baseUrl}/api/v1/academic/years`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const getData = await getRes.json();
      assert.ok(getData.data.some((y: any) => y.id === yearId));

      // 3. Update
      const updateRes = await fetch(`${baseUrl}/api/v1/academic/years/${yearId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({ name: '2026-2027 Updated Year' }),
      });
      assert.strictEqual(updateRes.status, 200);
      const updateData = await updateRes.json();
      assert.strictEqual(updateData.data.name, '2026-2027 Updated Year');

      // 4. Delete
      const delRes = await fetch(`${baseUrl}/api/v1/academic/years/${yearId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      assert.strictEqual(delRes.status, 200);
    });

    it('creates, lists, and manages terms linked to academic years', async () => {
      // Get year
      const yearsRes = await fetch(`${baseUrl}/api/v1/academic/years`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const yearsData = await yearsRes.json();
      const yearId = yearsData.data[0].id;

      // Create Term
      const createTermRes = await fetch(`${baseUrl}/api/v1/academic/terms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          academicYearId: yearId,
          name: 'Spring Semester 2026',
          startDate: '2026-02-01',
          endDate: '2026-06-15',
          isCurrent: true,
        }),
      });
      assert.strictEqual(createTermRes.status, 201);
      const termData = await createTermRes.json();
      assert.strictEqual(termData.data.name, 'Spring Semester 2026');

      // Get terms filtered by year
      const termsRes = await fetch(`${baseUrl}/api/v1/academic/terms?yearId=${yearId}`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const termsData = await termsRes.json();
      assert.ok(termsData.data.length > 0);
    });
  });

  // =========================================================================
  // 2. GRADES, CLASSROOMS & SECTIONS
  // =========================================================================
  describe('2. Grade Levels & Classrooms Structure', () => {
    it('creates grade level and sections with capacity constraints', async () => {
      // Create Grade
      const gradeRes = await fetch(`${baseUrl}/api/v1/academic/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          name: 'Grade 11 - Secondary',
          sequenceOrder: 11,
        }),
      });
      assert.strictEqual(gradeRes.status, 201);
      const gradeData = await gradeRes.json();
      const gradeId = gradeData.data.id;

      // Create Classroom in Grade
      const classRes = await fetch(`${baseUrl}/api/v1/academic/classrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          name: 'Section 11-A',
          gradeLevelId: gradeId,
          capacity: 32,
        }),
      });
      assert.strictEqual(classRes.status, 201);
      const classData = await classRes.json();
      assert.strictEqual(classData.data.name, 'Section 11-A');
      assert.strictEqual(classData.data.capacity, 32);

      // Filter classrooms by grade
      const listRes = await fetch(`${baseUrl}/api/v1/academic/classrooms?gradeLevelId=${gradeId}`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const listData = await listRes.json();
      assert.strictEqual(listData.data.length, 1);
      assert.strictEqual(listData.data[0].id, classData.data.id);
    });
  });

  // =========================================================================
  // 3. SUBJECTS & CURRICULUM
  // =========================================================================
  describe('3. Subjects & Curriculum Management', () => {
    it('creates and manages subjects with code and styling', async () => {
      const createSubRes = await fetch(`${baseUrl}/api/v1/academic/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          name: 'Artificial Intelligence & Data',
          code: 'AI-101',
          description: 'Introduction to machine learning and AI ethics',
          color: '#10b981',
        }),
      });
      assert.strictEqual(createSubRes.status, 201);
      const subData = await createSubRes.json();
      assert.strictEqual(subData.data.code, 'AI-101');
      assert.strictEqual(subData.data.color, '#10b981');

      // Update subject
      const updateSubRes = await fetch(`${baseUrl}/api/v1/academic/subjects/${subData.data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({ name: 'Advanced Artificial Intelligence' }),
      });
      assert.strictEqual(updateSubRes.status, 200);
      const updated = await updateSubRes.json();
      assert.strictEqual(updated.data.name, 'Advanced Artificial Intelligence');
    });
  });

  // =========================================================================
  // 4. TEACHER ASSIGNMENTS
  // =========================================================================
  describe('4. Teacher Assignments to Subjects & Sections', () => {
    it('assigns teacher to a subject and classroom with role and weekly hours', async () => {
      // Get teacher
      const teachersRes = await fetch(`${baseUrl}/api/v1/users?role=TEACHER`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const teachers = (await teachersRes.json()).data;
      const teacherId = teachers[0].id;

      // Get subject & classroom
      const subs = (await (await fetch(`${baseUrl}/api/v1/academic/subjects`, { headers: { Authorization: `Bearer ${adminTokenOrg1}` } })).json()).data;
      const classes = (await (await fetch(`${baseUrl}/api/v1/academic/classrooms`, { headers: { Authorization: `Bearer ${adminTokenOrg1}` } })).json()).data;

      const createAssignRes = await fetch(`${baseUrl}/api/v1/academic/teacher-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          teacherId,
          subjectId: subs[0].id,
          classroomId: classes[0].id,
          role: 'PRIMARY_TEACHER',
          weeklyHours: 6,
          status: 'ACTIVE',
        }),
      });
      assert.strictEqual(createAssignRes.status, 201);
      const assignData = await createAssignRes.json();
      assert.strictEqual(assignData.success, true);
      assert.strictEqual(assignData.data.teacherId, teacherId);
      assert.strictEqual(assignData.data.weeklyHours, 6);
      assert.strictEqual(assignData.data.role, 'PRIMARY_TEACHER');

      // Query teacher assignments
      const listAssignRes = await fetch(`${baseUrl}/api/v1/academic/teacher-assignments?teacherId=${teacherId}`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const listData = await listAssignRes.json();
      assert.ok(listData.data.some((a: any) => a.id === assignData.data.id));

      // Delete assignment
      const delAssignRes = await fetch(`${baseUrl}/api/v1/academic/teacher-assignments/${assignData.data.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      assert.strictEqual(delAssignRes.status, 200);
    });
  });

  // =========================================================================
  // 5. STUDENT ENROLLMENTS
  // =========================================================================
  describe('5. Student Enrollments & Roster Management', () => {
    it('enrolls student in classroom and academic year with roll number and status', async () => {
      // Get student
      const studentsRes = await fetch(`${baseUrl}/api/v1/users?role=STUDENT`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const students = (await studentsRes.json()).data;
      const studentId = students[0].id;

      // Get classroom
      const classes = (await (await fetch(`${baseUrl}/api/v1/academic/classrooms`, { headers: { Authorization: `Bearer ${adminTokenOrg1}` } })).json()).data;

      // Create a fresh academic year for testing enrollment
      const createYearRes = await fetch(`${baseUrl}/api/v1/academic/years`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          name: '2027-2028 Enrollment Test Year',
          startDate: '2027-09-01',
          endDate: '2028-06-30',
        }),
      });
      assert.strictEqual(createYearRes.status, 201);
      const testYear = (await createYearRes.json()).data;

      const enrollRes = await fetch(`${baseUrl}/api/v1/academic/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          studentId,
          classroomId: classes[0].id,
          academicYearId: testYear.id,
          rollNumber: 'RO-101',
          status: 'ACTIVE',
        }),
      });
      assert.strictEqual(enrollRes.status, 201);
      const enrData = await enrollRes.json();
      assert.strictEqual(enrData.data.studentId, studentId);
      assert.strictEqual(enrData.data.rollNumber, 'RO-101');
      assert.strictEqual(enrData.data.status, 'ACTIVE');

      // Filter enrollments by classroom
      const listEnrRes = await fetch(`${baseUrl}/api/v1/academic/enrollments?classroomId=${classes[0].id}`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const listEnrData = await listEnrRes.json();
      assert.ok(listEnrData.data.some((e: any) => e.id === enrData.data.id));

      // Update status to TRANSFERRED
      const updateEnrRes = await fetch(`${baseUrl}/api/v1/academic/enrollments/${enrData.data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({ status: 'TRANSFERRED' }),
      });
      assert.strictEqual(updateEnrRes.status, 200);
      const updatedEnr = await updateEnrRes.json();
      assert.strictEqual(updatedEnr.data.status, 'TRANSFERRED');
    });
  });

  // =========================================================================
  // 6. PARENT-STUDENT RELATIONSHIPS
  // =========================================================================
  describe('6. Parent-Student Guardianship Links', () => {
    it('creates parent-student link and verifies relationship metadata', async () => {
      // Get student
      const students = (await (await fetch(`${baseUrl}/api/v1/users?role=STUDENT`, { headers: { Authorization: `Bearer ${adminTokenOrg1}` } })).json()).data;
      const parents = (await (await fetch(`${baseUrl}/api/v1/users?role=PARENT`, { headers: { Authorization: `Bearer ${adminTokenOrg1}` } })).json()).data;

      const createLinkRes = await fetch(`${baseUrl}/api/v1/academic/parent-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          parentId: parents[0].id,
          studentId: students[0].id,
          relationship: 'MOTHER',
          isEmergencyContact: true,
        }),
      });
      assert.strictEqual(createLinkRes.status, 201);
      const linkData = await createLinkRes.json();
      assert.strictEqual(linkData.data.relationship, 'MOTHER');
      assert.strictEqual(linkData.data.isEmergencyContact, true);

      // List parent links
      const listLinksRes = await fetch(`${baseUrl}/api/v1/academic/parent-links?studentId=${students[0].id}`, {
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      const listLinksData = await listLinksRes.json();
      assert.ok(listLinksData.data.some((l: any) => l.id === linkData.data.id));

      // Delete link
      const delLinkRes = await fetch(`${baseUrl}/api/v1/academic/parent-links/${linkData.data.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminTokenOrg1}` },
      });
      assert.strictEqual(delLinkRes.status, 200);
    });
  });

  // =========================================================================
  // 7. MULTI-TENANT ISOLATION & RBAC SECURITY
  // =========================================================================
  describe('7. Multi-Tenant Isolation & RBAC Security', () => {
    it('prevents tenant Org2 from accessing or mutating Org1 academic records', async () => {
      // 1. Org1 creates a subject
      const subRes = await fetch(`${baseUrl}/api/v1/academic/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg1}`,
        },
        body: JSON.stringify({
          name: 'Org1 Secret Subject',
          code: 'SEC-101',
        }),
      });
      const subData = await subRes.json();
      const org1SubjectId = subData.data.id;

      // 2. Org2 lists subjects -> must NOT see Org1 subject
      const org2SubRes = await fetch(`${baseUrl}/api/v1/academic/subjects`, {
        headers: { Authorization: `Bearer ${adminTokenOrg2}` },
      });
      const org2Subjects = (await org2SubRes.json()).data;
      assert.strictEqual(org2Subjects.some((s: any) => s.id === org1SubjectId), false);

      // 3. Org2 tries to update Org1 subject -> must return 404 NOT_FOUND
      const updateRes = await fetch(`${baseUrl}/api/v1/academic/subjects/${org1SubjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenOrg2}`,
        },
        body: JSON.stringify({ name: 'Hacked Subject' }),
      });
      assert.strictEqual(updateRes.status, 404);

      // 4. Org2 tries to delete Org1 subject -> must return 404 NOT_FOUND
      const delRes = await fetch(`${baseUrl}/api/v1/academic/subjects/${org1SubjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminTokenOrg2}` },
      });
      assert.strictEqual(delRes.status, 404);
    });

    it('rejects student role from creating or deleting academic structure (RBAC)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/academic/years`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentTokenOrg1}`,
        },
        body: JSON.stringify({
          name: 'Student Created Year',
          startDate: '2026-09-01',
          endDate: '2027-06-30',
        }),
      });
      assert.strictEqual(res.status, 403);
    });
  });
});
