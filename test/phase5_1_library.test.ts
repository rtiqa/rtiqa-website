import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../server/platform/db.ts';

describe('Rtiqa Phase 5.1: Digital Learning Library & Curriculum Content', () => {
  const orgAId = 'org_horizon_001';
  const orgBId = 'org_elite_002';
  const teacherAId = 'usr_teacher_math_01';
  const studentAId = 'usr_student_01';

  describe('1. Curriculum Units Management', () => {
    test('creates and retrieves curriculum units for a course in Org A', () => {
      const course = db.getCourses(orgAId)[0];
      assert.ok(course, 'Course in Org A should exist');

      const unit = db.createUnit({
        organizationId: orgAId,
        courseId: course.id,
        title: 'الوحدة الرابعة: التفاضل والتكامل المتقدم',
        description: 'شرح وتطبيقات حساب النهايات والاشتقاق',
        orderIndex: 4,
        isPublished: true,
      });

      assert.ok(unit.id);
      assert.equal(unit.title, 'الوحدة الرابعة: التفاضل والتكامل المتقدم');
      assert.equal(unit.courseTitle, course.title);

      const units = db.getUnitsByCourse(course.id, orgAId);
      assert.ok(units.some((u) => u.id === unit.id));
    });

    test('enforces multi-tenant isolation on curriculum units', () => {
      const courseA = db.getCourses(orgAId)[0];
      const unitsForSchoolB = db.getUnitsByCourse(courseA.id, orgBId);
      assert.equal(unitsForSchoolB.length, 0, 'School B must not view School A units');
    });
  });

  describe('2. Digital Library Resource Lifecycle & RBAC', () => {
    let createdResourceId: string;

    test('creates a published library resource with tags and multi-format support', () => {
      const resource = db.createLibraryResource({
        organizationId: orgAId,
        title: 'مذكرة تدريبية: تطبيقات فيزياء الحركة والقوة',
        description: 'تمارين وتجارب عملية تفاعلية',
        resourceType: 'DOCUMENT',
        format: 'pdf',
        fileSize: 2048500,
        tags: ['فيزياء', 'قوة', 'تدريبات'],
        uploadedBy: teacherAId,
        authorName: 'فاطمة الزهراني',
        visibility: 'PUBLIC_SCHOOL',
        status: 'PUBLISHED',
        aiSearchable: true,
        aiSummary: 'ملخص شامل لقوانين نيوتن في الحركة وتطبيقاتها.',
      });

      assert.ok(resource.id);
      assert.equal(resource.title, 'مذكرة تدريبية: تطبيقات فيزياء الحركة والقوة');
      assert.equal(resource.tags.length, 3);
      createdResourceId = resource.id;
    });

    test('filters resources with role and search query', () => {
      const searchResults = db.getLibraryResources(orgAId, {
        search: 'فيزياء',
        role: 'STUDENT',
        userId: studentAId,
      });

      assert.ok(searchResults.length > 0);
      assert.ok(searchResults.some((r) => r.id === createdResourceId));
    });

    test('enforces multi-tenant isolation on digital library resources', () => {
      const schoolBRes = db.getLibraryResourceById(createdResourceId, orgBId);
      assert.equal(schoolBRes, undefined, 'School B must not be able to fetch School A resource');
    });

    test('strictly prevents STUDENT from seeing TEACHERS_ONLY, PRIVATE, and UNPUBLISHED resources', () => {
      const privateRes = db.createLibraryResource({
        organizationId: orgAId,
        title: 'خطة تقييم المعلمين الخاصة',
        resourceType: 'DOCUMENT',
        format: 'docx',
        uploadedBy: teacherAId,
        visibility: 'TEACHERS_ONLY',
        status: 'PUBLISHED',
      });

      const draftRes = db.createLibraryResource({
        organizationId: orgAId,
        title: 'مسودة اختبار غير منشورة',
        resourceType: 'DOCUMENT',
        format: 'pdf',
        uploadedBy: teacherAId,
        visibility: 'PUBLIC_SCHOOL',
        status: 'DRAFT',
      });

      const studentVisible = db.getLibraryResources(orgAId, {
        role: 'STUDENT',
        userId: studentAId,
      });

      assert.ok(!studentVisible.some((r) => r.id === privateRes.id), 'Student must not see TEACHERS_ONLY resource');
      assert.ok(!studentVisible.some((r) => r.id === draftRes.id), 'Student must not see DRAFT resource');
    });

    test('strictly prevents PARENT from seeing TEACHERS_ONLY resources', () => {
      const teacherOnlyRes = db.createLibraryResource({
        organizationId: orgAId,
        title: 'دليل تصحيح درجات المعلمين',
        resourceType: 'DOCUMENT',
        format: 'pdf',
        uploadedBy: teacherAId,
        visibility: 'TEACHERS_ONLY',
        status: 'PUBLISHED',
      });

      const parentVisible = db.getLibraryResources(orgAId, {
        role: 'PARENT',
        userId: 'usr_parent_01',
      });

      assert.ok(!parentVisible.some((r) => r.id === teacherOnlyRes.id), 'Parent must not see TEACHERS_ONLY resource');
    });

    test('supports full Arabic Unicode titles, descriptions, and tags', () => {
      const unicodeRes = db.createLibraryResource({
        organizationId: orgAId,
        title: 'المكتبة الرقمية: تجارب العلوم التفاعلية ١٢٣ 🧪💡',
        description: 'شرح مبسط للتفاعلات الكيميائية باللغة العربية مع اختبارات تجريبية',
        resourceType: 'INTERACTIVE',
        format: 'html5',
        tags: ['كيمياء', 'تفاعلات_كيميائية', 'علوم_الصف_الأول_ثانوي'],
        uploadedBy: teacherAId,
        visibility: 'PUBLIC_SCHOOL',
        status: 'PUBLISHED',
      });

      assert.ok(unicodeRes.id);
      assert.equal(unicodeRes.title, 'المكتبة الرقمية: تجارب العلوم التفاعلية ١٢٣ 🧪💡');
      assert.deepEqual(unicodeRes.tags, ['كيمياء', 'تفاعلات_كيميائية', 'علوم_الصف_الأول_ثانوي']);

      const found = db.getLibraryResources(orgAId, { search: 'تفاعلات_كيميائية' });
      assert.ok(found.some((r) => r.id === unicodeRes.id));
    });
  });

  describe('3. Resource Activities & Analytics Telemetry', () => {
    test('records user interaction activities and aggregates stats', () => {
      const resources = db.getLibraryResources(orgAId);
      assert.ok(resources.length > 0);
      const targetRes = resources[0];

      const initialViews = targetRes.viewCount;

      const activity = db.recordResourceActivity({
        organizationId: orgAId,
        resourceId: targetRes.id,
        userId: studentAId,
        userRole: 'STUDENT',
        action: 'VIEWED',
      });

      assert.ok(activity.id);
      assert.equal(activity.action, 'VIEWED');

      const updatedRes = db.getLibraryResourceById(targetRes.id, orgAId);
      assert.equal(updatedRes?.viewCount, initialViews + 1);

      const stats = db.getLibraryStats(orgAId);
      assert.ok(stats.totalResources > 0);
      assert.ok(stats.totalViews > 0);
    });
  });
});
