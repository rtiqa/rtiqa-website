import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/platform/db.ts';
import { CurriculumResolver } from '../server/platform/curriculumResolver.ts';

test('CurriculumResolver Hardening & Edge Cases', async (t) => {
  const superAdmin = db.createUser({
    email: 'super2@platform.com',
    fullName: 'Super Admin 2',
    role: 'SUPER_ADMIN',
    isActive: true,
  });

  const globalSubject = db.createSubject({
    organizationId: 'platform',
    name: 'Global Math',
    code: 'MATH-101',
    isGlobal: true,
  });

  const globalCourse = db.createCourse({
    organizationId: 'platform',
    subjectId: globalSubject.id,
    termId: 't1',
    classroomId: 'c1',
    title: 'Global Math Blueprint',
    isGlobal: true,
  });

  const globalUnit = db.createUnit({
    organizationId: 'platform',
    courseId: globalCourse.id,
    title: 'Unit 1: Algebra',
    orderIndex: 1,
    isPublished: true,
    isGlobal: true,
  });

  const globalLesson = db.createLesson({
    organizationId: 'platform',
    courseId: globalCourse.id,
    unitId: globalUnit.id,
    title: 'Variables',
    contentHtml: '<p>Variables Intro</p>',
    orderIndex: 1,
    isPublished: true,
    isGlobal: true,
  });

  const orgA = db.createOrganization({ name: 'School A Edge', slug: 'sae-' + Date.now(), countryCode: 'SA', timezone: 'Asia/Riyadh', locale: 'ar', isActive: true });
  const orgB = db.createOrganization({ name: 'School B Edge', slug: 'sbe-' + Date.now(), countryCode: 'SA', timezone: 'Asia/Riyadh', locale: 'ar', isActive: true });

  const localCourseA = CurriculumResolver.adoptGlobalCourse(globalCourse.id, orgA.id, 'cls', 'trm');
  const localHierarchyA = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
  const localUnitA = localHierarchyA.units[0];

  await t.test('1. School adopts Global Course then Global Course is updated', () => {
    // Update global content
    db.updateLesson(globalLesson.id, 'platform', { contentHtml: '<p>Variables V2</p>' });
    
    // Resolve for School A
    const h = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
    assert.strictEqual(h.units[0].lessons[0].contentHtml, '<p>Variables V2</p>');
  });

  await t.test('2. School has Local Override then Global Source is updated', () => {
    // School A creates override
    const override = CurriculumResolver.createLessonOverride(
      globalLesson.id,
      orgA.id,
      localCourseA.id,
      localUnitA.id,
      { title: 'Variables A' }
    );
    
    // Update global again
    db.updateLesson(globalLesson.id, 'platform', { contentHtml: '<p>Variables V3</p>' });
    
    // School A should still see its override which had V2 content at the time of override
    const h = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
    assert.strictEqual(h.units[0].lessons[0].title, 'Variables A');
    assert.strictEqual(h.units[0].lessons[0].contentHtml, '<p>Variables V2</p>');
  });

  await t.test('3. Deleting Local Override ensures Global Lesson returns', () => {
    const h1 = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
    const overrideId = h1.units[0].lessons[0].id;
    assert.notStrictEqual(overrideId, globalLesson.id);

    db.deleteLesson(overrideId, orgA.id);

    const h2 = CurriculumResolver.getResolvedCourseHierarchy(localCourseA.id, orgA.id)!;
    assert.strictEqual(h2.units[0].lessons[0].id, globalLesson.id);
    assert.strictEqual(h2.units[0].lessons[0].contentHtml, '<p>Variables V3</p>');
  });

  await t.test('4. Attempt to create Override for a lesson not belonging to the school\'s course', () => {
    const otherGlobalCourse = db.createCourse({
      organizationId: 'platform',
      subjectId: globalSubject.id,
      termId: 't1',
      classroomId: 'c1',
      title: 'Other Global Math',
    });
    const otherGlobalLesson = db.createLesson({
      organizationId: 'platform',
      courseId: otherGlobalCourse.id,
      title: 'Other Lesson',
      contentHtml: '',
      orderIndex: 1,
      isPublished: true,
    });

    assert.throws(() => {
      CurriculumResolver.createLessonOverride(otherGlobalLesson.id, orgA.id, localCourseA.id, localUnitA.id, {});
    }, /Lesson does not belong to the global course/);
  });

  await t.test('5. Cannot adopt into platform context', () => {
    assert.throws(() => {
      CurriculumResolver.adoptGlobalCourse(globalCourse.id, 'platform', 'c1', 't1');
    }, /Cannot adopt a global course into the platform itself/);
  });

  await t.test('6. Cannot create override in platform context', () => {
    assert.throws(() => {
      CurriculumResolver.createLessonOverride(globalLesson.id, 'platform', localCourseA.id, localUnitA.id, {});
    }, /Cannot create overrides in the platform context/);
  });

  await t.test('7. Cannot create multiple overrides for the same global lesson in the same course', () => {
    CurriculumResolver.createLessonOverride(globalLesson.id, orgA.id, localCourseA.id, localUnitA.id, { title: 'First Override' });
    
    assert.throws(() => {
      CurriculumResolver.createLessonOverride(globalLesson.id, orgA.id, localCourseA.id, localUnitA.id, { title: 'Second Override' });
    }, /An override already exists/);
  });
});
