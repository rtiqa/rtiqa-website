import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/platform/db.ts';
import { CurriculumResolver } from '../server/platform/curriculumResolver.ts';

test('Curriculum Syndication & Shadow Override Architecture Test Suite', async (t) => {
  // Setup standard environment

  // 1. Create a Super Admin and Global Content
  const superAdmin = db.createUser({
    email: 'super@platform.com',
    fullName: 'Super Admin',
    role: 'SUPER_ADMIN',
    isActive: true,
  });

  const globalSubject = db.createSubject({
    organizationId: 'platform',
    name: 'Global Physics',
    code: 'PHY-101',
    isGlobal: true,
  });

  const globalCourse = db.createCourse({
    organizationId: 'platform',
    subjectId: globalSubject.id,
    termId: 't1',
    classroomId: 'c1',
    title: 'Global Physics 101 Blueprint',
    isGlobal: true,
  });

  const globalUnit = db.createUnit({
    organizationId: 'platform',
    courseId: globalCourse.id,
    title: 'Unit 1: Mechanics',
    orderIndex: 1,
    isPublished: true,
    isGlobal: true,
  });

  const globalLesson1 = db.createLesson({
    organizationId: 'platform',
    courseId: globalCourse.id,
    unitId: globalUnit.id,
    title: 'Intro to Motion',
    contentHtml: '<p>Global Content 1</p>',
    orderIndex: 1,
    isPublished: true,
    isGlobal: true,
  });

  const globalLesson2 = db.createLesson({
    organizationId: 'platform',
    courseId: globalCourse.id,
    unitId: globalUnit.id,
    title: 'Newton Laws',
    contentHtml: '<p>Global Content 2</p>',
    orderIndex: 2,
    isPublished: true,
    isGlobal: true,
  });

  await t.test('1. SUPER_ADMIN can manage Global Content', () => {
    assert.ok(globalCourse.id);
    assert.strictEqual(globalCourse.organizationId, 'platform');
    assert.strictEqual(globalCourse.isGlobal, true);
    
    // Check that standard getter correctly retrieves platform content if explicitly requested
    const fetchedGlobal = db.getCourseById(globalCourse.id, 'platform');
    assert.ok(fetchedGlobal);
  });

  // Setup School A
  const orgA = db.createOrganization({ name: 'School A', slug: 'sa-' + Date.now(), countryCode: 'SA', timezone: 'Asia/Riyadh', locale: 'ar', isActive: true });
  const teacherA = db.createUser({ email: 'teachA@a.com', fullName: 'Teach A', role: 'TEACHER', isActive: true });
  db.createMembership({ userId: teacherA.id, organizationId: orgA.id, role: 'TEACHER', isDefault: true, status: 'ACTIVE' });

  // Setup School B
  const orgB = db.createOrganization({ name: 'School B', slug: 'sb-' + Date.now(), countryCode: 'SA', timezone: 'Asia/Riyadh', locale: 'ar', isActive: true });
  const teacherB = db.createUser({ email: 'teachB@b.com', fullName: 'Teach B', role: 'TEACHER', isActive: true });
  db.createMembership({ userId: teacherB.id, organizationId: orgB.id, role: 'TEACHER', isDefault: true, status: 'ACTIVE' });

  await t.test('2. Global Content can be read by different schools (via Syndication)', () => {
    const localCourseA = CurriculumResolver.adoptGlobalCourse(globalCourse.id, orgA.id, 'clsA', 'termA');
    const localCourseB = CurriculumResolver.adoptGlobalCourse(globalCourse.id, orgB.id, 'clsB', 'termB');

    assert.ok(localCourseA);
    assert.strictEqual(localCourseA.organizationId, orgA.id);
    assert.strictEqual(localCourseA.globalReferenceId, globalCourse.id);
    
    assert.ok(localCourseB);
    assert.strictEqual(localCourseB.organizationId, orgB.id);

    // School A hierarchy
    const hierarchyA = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id);
    assert.ok(hierarchyA);
    assert.strictEqual(hierarchyA.units.length, 1);
    
    // Check that global lessons appear under local unit
    assert.strictEqual(hierarchyA.units[0].lessons.length, 2);
    assert.strictEqual(hierarchyA.units[0].lessons[0].title, 'Intro to Motion');
    assert.strictEqual(hierarchyA.units[0].lessons[0].id, globalLesson1.id); // Maintains global ID reference
  });

  await t.test('3. School A cannot modify Global Content directly via DB checks', () => {
    // Attempting to update the global lesson directly with School A's orgId should fail (return undefined/false in strict matching)
    const updateResult = db.updateLesson(globalLesson1.id, orgA.id, { title: 'Hacked Title' });
    assert.strictEqual(updateResult, undefined);

    // Verify it didn't change
    const untouched = db.getLessonById(globalLesson1.id, 'platform');
    assert.strictEqual(untouched!.title, 'Intro to Motion');
  });

  let localLessonAOverride: any;

  await t.test('4. School A can create its own local Override (Shadow Copy)', () => {
    const localCourseA = db.getCourses(orgA.id).find(c => c.globalReferenceId === globalCourse.id)!;
    const hierarchyA = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
    
    const targetLocalUnitId = hierarchyA.units[0].id;

    // School A overrides globalLesson1
    localLessonAOverride = CurriculumResolver.createLessonOverride(
      globalLesson1.id,
      orgA.id,
      localCourseA.id,
      targetLocalUnitId,
      { title: 'Intro to Motion (School A Version)' }
    );

    assert.ok(localLessonAOverride);
    assert.strictEqual(localLessonAOverride.organizationId, orgA.id);
    assert.strictEqual(localLessonAOverride.globalReferenceId, globalLesson1.id);
    assert.strictEqual(localLessonAOverride.title, 'Intro to Motion (School A Version)');
    assert.strictEqual(localLessonAOverride.contentHtml, '<p>Global Content 1</p>'); // Inherited unmodified prop

    // Re-resolve School A hierarchy
    const newHierarchyA = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
    
    assert.strictEqual(newHierarchyA.units[0].lessons.length, 2);
    // The overridden lesson should be first
    assert.strictEqual(newHierarchyA.units[0].lessons[0].id, localLessonAOverride.id);
    assert.strictEqual(newHierarchyA.units[0].lessons[0].title, 'Intro to Motion (School A Version)');
    // The untouched global lesson should be second
    assert.strictEqual(newHierarchyA.units[0].lessons[1].id, globalLesson2.id);
  });

  await t.test('5. School B cannot see School A\'s Override (Tenant Isolation)', () => {
    const localCourseB = db.getCourses(orgB.id).find(c => c.globalReferenceId === globalCourse.id)!;
    const hierarchyB = CurriculumResolver.getResolvedCourseHierarchy(localCourseB.id, orgB.id)!;
    
    assert.strictEqual(hierarchyB.units[0].lessons.length, 2);
    // School B still sees the original global lesson 1
    assert.strictEqual(hierarchyB.units[0].lessons[0].id, globalLesson1.id);
    assert.strictEqual(hierarchyB.units[0].lessons[0].title, 'Intro to Motion');
  });

  await t.test('6. Updating Global Content does not destroy Local Override (Non-Destructive Updates)', () => {
    // Super admin updates the original global lesson
    db.updateLesson(globalLesson1.id, 'platform', { contentHtml: '<p>Updated Global Content</p>' });
    
    // Check School B (gets the update)
    const localCourseB = db.getCourses(orgB.id).find(c => c.globalReferenceId === globalCourse.id)!;
    const hierarchyB = CurriculumResolver.getResolvedCourseHierarchy(localCourseB.id, orgB.id)!;
    assert.strictEqual(hierarchyB.units[0].lessons[0].contentHtml, '<p>Updated Global Content</p>');
    
    // Check School A (keeps its override which had the old content because we didn't push a merge)
    const localCourseA = db.getCourses(orgA.id).find(c => c.globalReferenceId === globalCourse.id)!;
    const hierarchyA = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
    assert.strictEqual(hierarchyA.units[0].lessons[0].contentHtml, '<p>Global Content 1</p>');
    assert.strictEqual(hierarchyA.units[0].lessons[0].title, 'Intro to Motion (School A Version)');
  });

  await t.test('7. Forging organizationId cannot access another tenant override', () => {
    // School B tries to fetch School A's override explicitly
    const forgedFetch = db.getLessonById(localLessonAOverride.id, orgB.id);
    assert.strictEqual(forgedFetch, undefined); // Fails strictly
  });
});
