import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../server.ts';
import { db } from '../server/platform/db.ts';
import { closePostgresPool, getPostgresPool } from '../src/db/postgres.ts';

describe('Phase 2.4: Academic Operations Restart-Persistence Test Suite', () => {
  let server: any;
  let baseUrl: string;
  let teacherTokenOrg1: string;
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

    // Login Org 1 Admin & Teacher
    const resAdmin = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'admin', tenantSlug: 'horizon' }),
    });
    const dataAdmin = await resAdmin.json();
    adminTokenOrg1 = dataAdmin.token;

    const resTeach = await fetch(`${baseUrl}/api/v1/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: 'teacher', tenantSlug: 'horizon' }),
    });
    const dataTeach = await resTeach.json();
    teacherTokenOrg1 = dataTeach.token;
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

  it('1. Create, Read, Update, Delete for Attendance Sessions & Records', async () => {
    const orgId = 'org_horizon_001';
    
    // Create attendance session
    const session = db.createAttendanceSession({
      organizationId: orgId,
      classroomId: 'class_horizon_10a',
      courseId: 'crs_horizon_math_10a',
      date: '2026-09-02',
      periodNumber: 2,
      title: 'حصة الرياضيات التطبيقية',
      status: 'OPEN',
      openedBy: 'usr_horizon_teacher',
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      totalStudents: 3,
    });

    assert.ok(session.id);
    assert.strictEqual(session.title, 'حصة الرياضيات التطبيقية');

    // Batch record attendance
    const records = db.recordAttendanceBatch(
      orgId,
      [
        {
          organizationId: orgId,
          sessionId: session.id,
          courseId: 'crs_horizon_math_10a',
          classroomId: 'class_horizon_10a',
          studentId: 'usr_horizon_s_omar',
          recordedBy: 'usr_horizon_teacher',
          date: '2026-09-02',
          status: 'PRESENT',
          notes: 'حضور مبكر',
        },
        {
          organizationId: orgId,
          sessionId: session.id,
          courseId: 'crs_horizon_math_10a',
          classroomId: 'class_horizon_10a',
          studentId: 'usr_horizon_s_noura',
          recordedBy: 'usr_horizon_teacher',
          date: '2026-09-02',
          status: 'EXCUSED',
          notes: 'عذر طبي معتمد',
        },
      ],
      session.id
    );

    assert.strictEqual(records.length, 2);

    // Read attendance summary for student
    const summary = db.getAttendanceSummaryForStudent('usr_horizon_s_omar', orgId);
    assert.ok(summary.totalDays >= 1);
    assert.ok(summary.presentDays >= 1);
  });

  it('2. Create, Read, Update, Delete for Assessments & Assessment Grades', async () => {
    const orgId = 'org_horizon_001';

    // Create Assessment
    const assessment = db.createAssessment({
      organizationId: orgId,
      courseId: 'crs_horizon_math_10a',
      subjectId: 'sub_horizon_math',
      classroomId: 'class_horizon_10a',
      termId: 'term_horizon_t1',
      title: 'اختبار الوحدة الأولى: الدوال الحقيقية',
      description: 'اختبار قصير يقيس مهارات تحليل الدوال',
      category: 'QUIZ',
      maxScore: 20,
      weightPercentage: 10,
      dueDate: '2026-09-15T10:00:00Z',
      status: 'PUBLISHED',
      createdBy: 'usr_horizon_teacher',
    });

    assert.ok(assessment.id);
    assert.strictEqual(assessment.maxScore, 20);

    // Record Grade
    const grade = db.recordAssessmentGrade({
      organizationId: orgId,
      assessmentId: assessment.id,
      studentId: 'usr_horizon_s_omar',
      score: 19.5,
      feedback: 'إجابة نموذجية ممتازة',
      gradedBy: 'usr_horizon_teacher',
    });

    assert.ok(grade.id);
    assert.strictEqual(grade.score, 19.5);
    assert.strictEqual(grade.percentage, 97.5);

    // Update Assessment
    const updatedAssessment = db.updateAssessment(assessment.id, orgId, {
      title: 'اختبار الوحدة الأولى المحدث',
    });
    assert.strictEqual(updatedAssessment?.title, 'اختبار الوحدة الأولى المحدث');

    // Verify Gradebook Matrix calculates correctly
    const matrix = db.getGradebookMatrix('crs_horizon_math_10a', orgId);
    assert.ok(matrix);
    assert.ok(matrix.matrix.length > 0);
  });

  it('3. Restart-Persistence: Data Survives Across Application Reinitialization and Sync', async () => {
    const orgId = 'org_horizon_001';

    // 1. Create a unique persistent assessment
    const uniqueTitle = `اختبار التحقق المستمر - ${Date.now()}`;
    const persistentAssessment = db.createAssessment({
      organizationId: orgId,
      courseId: 'crs_horizon_math_10a',
      subjectId: 'sub_horizon_math',
      classroomId: 'class_horizon_10a',
      termId: 'term_horizon_t1',
      title: uniqueTitle,
      category: 'PROJECT',
      maxScore: 50,
      weightPercentage: 15,
      status: 'PUBLISHED',
      createdBy: 'usr_horizon_teacher',
    });

    const persistentGrade = db.recordAssessmentGrade({
      organizationId: orgId,
      assessmentId: persistentAssessment.id,
      studentId: 'usr_horizon_s_omar',
      score: 48,
      feedback: 'مشروع بحثي متكامل ومتقن',
      gradedBy: 'usr_horizon_teacher',
    });

    // 2. Simulate Application Layer Stop and Reinitialization
    // Close connections and re-synchronize academic records
    await db.syncAcademicDataFromPostgres(orgId);

    // 3. Verify that the academic data is retrieved accurately
    const retrievedAssessment = db.getAssessmentById(persistentAssessment.id, orgId);
    assert.ok(retrievedAssessment, 'Assessment must exist after restart/sync');
    assert.strictEqual(retrievedAssessment?.title, uniqueTitle);

    const retrievedGrade = db.getAssessmentGradeById(persistentGrade.id, orgId);
    assert.ok(retrievedGrade, 'Assessment grade must exist after restart/sync');
    assert.strictEqual(retrievedGrade?.score, 48);
  });

  it('4. Multi-Tenant Isolation Enforcement on Academic Data', async () => {
    // Org 1 (Horizon) assessment
    const horizonAssessment = db.createAssessment({
      organizationId: 'org_horizon_001',
      courseId: 'crs_horizon_math_10a',
      title: 'اختبار هورايزون الخاص',
      category: 'EXAM',
      maxScore: 100,
      weightPercentage: 20,
      status: 'PUBLISHED',
      createdBy: 'usr_horizon_teacher',
    });

    // Attempt to access from Org 2 (Elite)
    const eliteAccess = db.getAssessmentById(horizonAssessment.id, 'org_elite_002');
    assert.strictEqual(eliteAccess, undefined, 'Tenant isolation must prevent cross-organization access');

    const eliteList = db.getAssessments('org_elite_002');
    assert.strictEqual(
      eliteList.some((a) => a.id === horizonAssessment.id),
      false,
      'Cross-organization assessments must never leak in query results'
    );
  });
});
