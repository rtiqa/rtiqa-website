import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/platform/db.ts';
import { RAGService } from '../server/platform/ai/rag/ragService.ts';
import { CurriculumResolver } from '../server/platform/curriculumResolver.ts';

test('RAG Authorization & Security', async (t) => {
  // 1. Setup Base Environment
  const orgA = db.createOrganization({ name: 'School A', slug: 'sa-' + Date.now(), countryCode: 'SA', timezone: 'Asia/Riyadh', locale: 'ar', isActive: true });
  const orgB = db.createOrganization({ name: 'School B', slug: 'sb-' + Date.now(), countryCode: 'SA', timezone: 'Asia/Riyadh', locale: 'ar', isActive: true });

  const studentA = db.createUser({ email: `studentA-${Date.now()}@a.com`, fullName: 'Student A', role: 'STUDENT', isActive: true });
  const teacherA = db.createUser({ email: `teacherA-${Date.now()}@a.com`, fullName: 'Teacher A', role: 'TEACHER', isActive: true });
  const studentB = db.createUser({ email: `studentB-${Date.now()}@b.com`, fullName: 'Student B', role: 'STUDENT', isActive: true });
  const dualUser = db.createUser({ email: `dual-${Date.now()}@x.com`, fullName: 'Dual User', role: 'STUDENT', isActive: true });
  const superAdmin = db.createUser({ email: `super-${Date.now()}@admin.com`, fullName: 'Super Admin', role: 'SUPER_ADMIN', isActive: true });

  const memStudentA = db.createMembership({ userId: studentA.id, organizationId: orgA.id, role: 'STUDENT', isDefault: true, status: 'ACTIVE' });
  const memTeacherA = db.createMembership({ userId: teacherA.id, organizationId: orgA.id, role: 'TEACHER', isDefault: true, status: 'ACTIVE' });
  const memStudentB = db.createMembership({ userId: studentB.id, organizationId: orgB.id, role: 'STUDENT', isDefault: true, status: 'ACTIVE' });
  const memDualA = db.createMembership({ userId: dualUser.id, organizationId: orgA.id, role: 'STUDENT', isDefault: true, status: 'ACTIVE' });
  const memDualB = db.createMembership({ userId: dualUser.id, organizationId: orgB.id, role: 'STUDENT', isDefault: false, status: 'ACTIVE' });
  const memSuperA = db.createMembership({ userId: superAdmin.id, organizationId: orgA.id, role: 'SUPER_ADMIN', isDefault: true, status: 'ACTIVE' });

  // 2. Index Test Documents

  // School A Documents
  const schoolAPublic = await RAGService.indexDocument({
    organizationId: orgA.id,
    documentId: 'doc_a_pub',
    title: 'School A Public',
    content: 'Welcome to School A. This is a public document.',
    sourceType: 'LIBRARY_RESOURCE',
    sourceVisibility: 'PUBLIC_SCHOOL',
  });
  
  const schoolAPrivateTeacher = await RAGService.indexDocument({
    organizationId: orgA.id,
    documentId: 'doc_a_priv',
    title: 'School A Teacher Only',
    content: 'School A Teacher secrets and exam answers.',
    sourceType: 'LIBRARY_RESOURCE',
    sourceVisibility: 'TEACHERS_ONLY',
  });

  // School B Documents
  const schoolBPublic = await RAGService.indexDocument({
    organizationId: orgB.id,
    documentId: 'doc_b_pub',
    title: 'School B Public',
    content: 'Welcome to School B. This is a public document.',
    sourceType: 'LIBRARY_RESOURCE',
    sourceVisibility: 'PUBLIC_SCHOOL',
  });

  // Global Documents (Platform)
  const globalSubject = db.createSubject({ organizationId: 'platform', name: 'Global Science', code: 'SCI-101', isGlobal: true });
  const globalCourse = db.createCourse({ organizationId: 'platform', subjectId: globalSubject.id, termId: 't1', classroomId: 'c1', title: 'Global Science', isGlobal: true });
  const globalUnit = db.createUnit({ organizationId: 'platform', courseId: globalCourse.id, title: 'Unit 1', orderIndex: 1, isPublished: true, isGlobal: true });
  const globalLesson = db.createLesson({ organizationId: 'platform', courseId: globalCourse.id, unitId: globalUnit.id, title: 'Global Gravity', contentHtml: 'Global Gravity Lesson Content', orderIndex: 1, isPublished: true, isGlobal: true });
  
  await RAGService.indexDocument({
    organizationId: 'platform',
    documentId: globalLesson.id,
    sourceId: globalLesson.id,
    sourceType: 'LESSON',
    title: 'Global Gravity',
    content: 'Global Gravity Lesson Content',
  });

  // Local Override for School A
  const localCourseA = CurriculumResolver.adoptGlobalCourse(globalCourse.id, orgA.id, 'clsA', 'trmA');
  const localHierarchyA = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
  const localUnitA = localHierarchyA.units[0];
  
  const overrideLesson = CurriculumResolver.createLessonOverride(
    globalLesson.id, orgA.id, localCourseA.id, localUnitA.id, { title: 'Local Gravity A', contentHtml: 'Local Gravity A Content' }
  );

  await RAGService.indexDocument({
    organizationId: orgA.id,
    documentId: overrideLesson.id,
    sourceId: overrideLesson.id,
    sourceType: 'LESSON',
    title: 'Local Gravity A',
    content: 'Local Gravity A Content',
  });

  // AI Conversation Private Data
  await RAGService.indexDocument({
    organizationId: orgA.id,
    documentId: 'conv_student_a',
    title: 'Student A Chat',
    content: 'Student A private chat about failing math.',
    sourceType: 'AI_CONVERSATION',
    userId: studentA.id,
    metadata: { userId: studentA.id }
  });

  // TESTS

  await t.test('1. Strict Tenant Isolation (Cross-Tenant Rejection)', async () => {
    const results = await RAGService.secureSearch(studentA, memStudentA, { query: 'Welcome to School' });
    
    // Should see School A, not School B
    assert.ok(results.some(r => r.chunk.documentId === 'doc_a_pub'), 'Should see School A doc');
    assert.ok(!results.some(r => r.chunk.documentId === 'doc_b_pub'), 'Should NOT see School B doc');
  });

  await t.test('2. Role-Based Filtering (Student vs Teacher)', async () => {
    // Teacher sees both
    const teacherResults = await RAGService.secureSearch(teacherA, memTeacherA, { query: 'School A' });
    assert.ok(teacherResults.some(r => r.chunk.documentId === 'doc_a_pub'));
    assert.ok(teacherResults.some(r => r.chunk.documentId === 'doc_a_priv'));

    // Student only sees public
    const studentResults = await RAGService.secureSearch(studentA, memStudentA, { query: 'School A' });
    assert.ok(studentResults.some(r => r.chunk.documentId === 'doc_a_pub'));
    assert.ok(!studentResults.some(r => r.chunk.documentId === 'doc_a_priv'));
  });

  await t.test('3. Forged OrganizationId is Ignored', async () => {
    // Student B tries to pass orgA context inside params to trick it
    // But secureSearch doesn't accept orgId in SearchParams anymore, it uses activeMembership!
    // We can simulate an attack by checking they can't see School A's doc
    const results = await RAGService.secureSearch(studentB, memStudentB, { query: 'School A' });
    assert.ok(!results.some(r => r.chunk.documentId === 'doc_a_pub'), 'Student B cannot access School A data');
  });

  await t.test('4. Dual-Membership Context Switching', async () => {
    // Dual user as School A
    const resultsA = await RAGService.secureSearch(dualUser, memDualA, { query: 'School' });
    assert.ok(resultsA.some(r => r.chunk.documentId === 'doc_a_pub'));
    assert.ok(!resultsA.some(r => r.chunk.documentId === 'doc_b_pub'));

    // Dual user as School B
    const resultsB = await RAGService.secureSearch(dualUser, memDualB, { query: 'School' });
    assert.ok(!resultsB.some(r => r.chunk.documentId === 'doc_a_pub'));
    assert.ok(resultsB.some(r => r.chunk.documentId === 'doc_b_pub'));
  });

  await t.test('5. Global Content & Local Override Conflict', async () => {
    // School A has an override. RAG should return Local Gravity, NOT Global Gravity
    const resultsA = await RAGService.secureSearch(studentA, memStudentA, { query: 'Gravity' });
    assert.ok(resultsA.some(r => r.chunk.documentId === overrideLesson.id), 'Should see Override');
    assert.ok(!resultsA.some(r => r.chunk.documentId === globalLesson.id), 'Should NOT see Global Lesson because it is overridden');

    // School B does NOT have an override. RAG should return Global Gravity
    const resultsB = await RAGService.secureSearch(studentB, memStudentB, { query: 'Gravity' });
    assert.ok(!resultsB.some(r => r.chunk.documentId === overrideLesson.id), 'School B cannot see School A override');
    assert.ok(resultsB.some(r => r.chunk.documentId === globalLesson.id), 'School B sees Global Lesson');
  });

  await t.test('6. Super Admin Respects Context Boundaries', async () => {
    // Super Admin acting in School A context should NOT see School B documents
    // (They would need to switch membership context to School B first)
    const results = await RAGService.secureSearch(superAdmin, memSuperA, { query: 'School' });
    assert.ok(results.some(r => r.chunk.documentId === 'doc_a_pub'));
    assert.ok(!results.some(r => r.chunk.documentId === 'doc_b_pub'));
  });

  await t.test('7. AI Conversation Privacy', async () => {
    // Student A can see their own conversation
    const resultsA = await RAGService.secureSearch(studentA, memStudentA, { query: 'failing math' });
    assert.ok(resultsA.some(r => r.chunk.documentId === 'conv_student_a'));

    // Teacher A CANNOT see Student A's private conversation, even in the same school
    const resultsTeacher = await RAGService.secureSearch(teacherA, memTeacherA, { query: 'failing math' });
    assert.ok(!resultsTeacher.some(r => r.chunk.documentId === 'conv_student_a'), 'Teacher cannot read private AI conversations');
  });

  await t.test('8. Tenant Billing / AI Usage Recording', async () => {
    // Check if db recorded usage for Student A
    const usages = db.getAIUsage(orgA.id, studentA.id);
    assert.ok(usages.length > 0, 'Should have recorded usage for Student A');
    assert.strictEqual(usages[0].organizationId, orgA.id);
    assert.strictEqual(usages[0].userId, studentA.id);
    assert.strictEqual(usages[0].membershipId, memStudentA.id);
    assert.strictEqual(usages[0].featureName, 'RAG_SEARCH');
  });

  await t.test('9. AI Conversation without owner is rejected', async () => {
    await assert.rejects(async () => {
      await RAGService.indexDocument({
        organizationId: orgA.id,
        documentId: 'conv_no_owner',
        title: 'No Owner Chat',
        content: 'Secret chat without owner',
        sourceType: 'AI_CONVERSATION',
      });
    }, /requires a mandatory userId/);
  });

  await t.test('10. Deleting override restores Global Content', async () => {
    // Delete override lesson
    db.deleteLesson(overrideLesson.id, orgA.id);

    // Now School A search for Gravity should return Global Lesson again
    const resultsA = await RAGService.secureSearch(studentA, memStudentA, { query: 'Gravity' });
    assert.ok(resultsA.some(r => r.chunk.documentId === globalLesson.id), 'Deleting override restores Global Content');
  });
});
