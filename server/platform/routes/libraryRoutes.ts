import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireRoles } from '../auth.ts';
import type {
  CurriculumUnit,
  LibraryResource,
  LibraryResourceType,
  LibraryResourceVisibility,
  LibraryResourceStatus,
  ResourceActivityAction,
} from '../types.ts';

export const libraryRouter = express.Router();

// ==========================================
// Curriculum Units Endpoints
// ==========================================

// List units for a course
libraryRouter.get('/units/course/:courseId', (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const { courseId } = req.params;

  const units = db.getUnitsByCourse(courseId, orgId);
  res.json({ units });
});

// Get single unit details
libraryRouter.get('/units/:id', (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const unit = db.getUnitById(req.params.id, orgId);
  if (!unit) {
    return res.status(404).json({ error: 'الوحدة الدراسية غير موجودة' });
  }
  res.json({ unit });
});

// Create curriculum unit (Teacher or Admin)
libraryRouter.post('/units', requireRoles(['ORG_ADMIN', 'TEACHER', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const { courseId, title, description, orderIndex, isPublished } = req.body;

  if (!courseId || !title) {
    return res.status(400).json({ error: 'المقرر الدراسي وعنوان الوحدة مطلوبان' });
  }

  const existingUnits = db.getUnitsByCourse(courseId, orgId);
  const nextOrder = orderIndex ?? (existingUnits.length > 0 ? Math.max(...existingUnits.map(u => u.orderIndex)) + 1 : 1);

  const unit = db.createUnit({
    organizationId: orgId,
    courseId,
    title,
    description: description || undefined,
    orderIndex: nextOrder,
    isPublished: isPublished !== false,
  });

  res.status(201).json({ unit });
});

// Update curriculum unit
libraryRouter.put('/units/:id', requireRoles(['ORG_ADMIN', 'TEACHER', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const { title, description, orderIndex, isPublished } = req.body;

  const updated = db.updateUnit(req.params.id, orgId, {
    title,
    description,
    orderIndex,
    isPublished,
  });

  if (!updated) {
    return res.status(404).json({ error: 'تعذر تعديل الوحدة الدراسية' });
  }

  res.json({ unit: updated });
});

// Delete curriculum unit
libraryRouter.delete('/units/:id', requireRoles(['ORG_ADMIN', 'TEACHER', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const success = db.deleteUnit(req.params.id, orgId);
  if (!success) {
    return res.status(404).json({ error: 'تعذر حذف الوحدة الدراسية' });
  }
  res.json({ success: true });
});

// ==========================================
// Digital Library Resources Endpoints
// ==========================================

// Get library statistics
libraryRouter.get('/resources/stats', (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const stats = db.getLibraryStats(orgId);
  res.json({ stats });
});

// Query and filter library resources
libraryRouter.get('/resources', (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const user = req.user!;

  const {
    subjectId,
    gradeLevelId,
    courseId,
    unitId,
    lessonId,
    resourceType,
    status,
    visibility,
    search,
  } = req.query;

  // If student, gather their enrolled course IDs for permission check
  let enrolledCourseIds: string[] = [];
  if (user.role === 'STUDENT') {
    const enrollments = db.getStudentEnrollments(orgId, { studentId: user.id, status: 'ACTIVE' });
    const classroomIds = enrollments.map(e => e.classroomId).filter(Boolean) as string[];
    const courses = db.getCourses(orgId);
    enrolledCourseIds = courses.filter(c => classroomIds.includes(c.classroomId)).map(c => c.id);
  }

  const resources = db.getLibraryResources(orgId, {
    subjectId: subjectId as string,
    gradeLevelId: gradeLevelId as string,
    courseId: courseId as string,
    unitId: unitId as string,
    lessonId: lessonId as string,
    resourceType: resourceType as LibraryResourceType,
    status: status as LibraryResourceStatus,
    visibility: visibility as LibraryResourceVisibility,
    search: search as string,
    role: user.role,
    userId: user.id,
    enrolledCourseIds,
  });

  res.json({ resources });
});

// Get single resource
libraryRouter.get('/resources/:id', (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const user = req.user!;
  const resource = db.getLibraryResourceById(req.params.id, orgId);
  if (!resource) {
    return res.status(404).json({ error: 'المورد التعليمي غير موجود' });
  }

  // Authorization check based on role and visibility
  if (user.role === 'STUDENT') {
    if (resource.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'المورد التعليمي غير متاح' });
    }
    if (resource.visibility === 'TEACHERS_ONLY' || resource.visibility === 'PRIVATE') {
      return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذا المورد' });
    }
    if (resource.visibility === 'COURSE_STUDENTS' && resource.courseId) {
      const enrollments = db.getStudentEnrollments(orgId, { studentId: user.id, status: 'ACTIVE' });
      const classroomIds = enrollments.map((e) => e.classroomId).filter(Boolean) as string[];
      const courses = db.getCourses(orgId);
      const enrolledCourseIds = courses.filter((c) => classroomIds.includes(c.classroomId)).map((c) => c.id);
      if (!enrolledCourseIds.includes(resource.courseId)) {
        return res.status(403).json({ error: 'غير مصرح بالوصول إلى مورد هذا المقرر' });
      }
    }
  } else if (user.role === 'PARENT') {
    if (resource.status !== 'PUBLISHED' || resource.visibility === 'TEACHERS_ONLY' || resource.visibility === 'PRIVATE') {
      return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذا المورد' });
    }
  } else if (user.role === 'TEACHER') {
    if (resource.visibility === 'PRIVATE' && resource.uploadedBy !== user.id) {
      return res.status(403).json({ error: 'غير مصرح بالوصول إلى هذا المورد الخاص' });
    }
  }

  res.json({ resource });
});

// Create new resource (Teachers / Admins)
libraryRouter.post('/resources', requireRoles(['ORG_ADMIN', 'TEACHER', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const user = req.user!;

  const {
    title,
    description,
    resourceType,
    format,
    subjectId,
    gradeLevelId,
    courseId,
    unitId,
    lessonId,
    storageObjectId,
    externalUrl,
    fileSize,
    fileType,
    tags,
    visibility,
    status,
    aiSearchable,
    aiSummary,
  } = req.body;

  if (!title || !resourceType || !format) {
    return res.status(400).json({ error: 'عنوان المورد ونوعه وصيغته حقول إجبارية' });
  }

  const resource = db.createLibraryResource({
    organizationId: orgId,
    title,
    description: description || undefined,
    resourceType,
    format,
    subjectId: subjectId || undefined,
    gradeLevelId: gradeLevelId || undefined,
    courseId: courseId || undefined,
    unitId: unitId || undefined,
    lessonId: lessonId || undefined,
    storageObjectId: storageObjectId || undefined,
    externalUrl: externalUrl || undefined,
    fileSize: fileSize ? Number(fileSize) : 0,
    fileType: fileType || undefined,
    tags: Array.isArray(tags) ? tags : [],
    uploadedBy: user.id,
    authorName: user.fullName || 'معلم',
    visibility: visibility || 'PUBLIC_SCHOOL',
    status: status || 'PUBLISHED',
    aiSearchable: aiSearchable !== false,
    aiSummary: aiSummary || undefined,
  });

  // Automatically record ATTACHED activity
  db.recordResourceActivity({
    organizationId: orgId,
    resourceId: resource.id,
    userId: user.id,
    userRole: user.role,
    action: 'ATTACHED',
    courseId: courseId || undefined,
    lessonId: lessonId || undefined,
  });

  res.status(201).json({ resource });
});

// Update resource
libraryRouter.put('/resources/:id', requireRoles(['ORG_ADMIN', 'TEACHER', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const user = req.user!;
  const existing = db.getLibraryResourceById(req.params.id, orgId);

  if (!existing) {
    return res.status(404).json({ error: 'المورد التعليمي غير موجود' });
  }

  // Teacher can only edit their own resources unless admin
  if (user.role === 'TEACHER' && existing.uploadedBy !== user.id) {
    return res.status(403).json({ error: 'غير مصرح بتعديل هذا المورد' });
  }

  const updated = db.updateLibraryResource(req.params.id, orgId, req.body);
  res.json({ resource: updated });
});

// Delete resource
libraryRouter.delete('/resources/:id', requireRoles(['ORG_ADMIN', 'TEACHER', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const user = req.user!;
  const existing = db.getLibraryResourceById(req.params.id, orgId);

  if (!existing) {
    return res.status(404).json({ error: 'المورد التعليمي غير موجود' });
  }

  if (user.role === 'TEACHER' && existing.uploadedBy !== user.id) {
    return res.status(403).json({ error: 'غير مصرح بحذف هذا المورد' });
  }

  const success = db.deleteLibraryResource(req.params.id, orgId);
  res.json({ success });
});

// Record user activity (Viewed, Downloaded, Completed)
libraryRouter.post('/resources/:id/activity', (req: PlatformRequest, res: express.Response) => {
  const orgId = req.organization!.id;
  const user = req.user!;
  const { action, courseId, lessonId } = req.body;

  if (!action || !['VIEWED', 'DOWNLOADED', 'COMPLETED'].includes(action)) {
    return res.status(400).json({ error: 'نوع النشاط غير صالح' });
  }

  const activity = db.recordResourceActivity({
    organizationId: orgId,
    resourceId: req.params.id,
    userId: user.id,
    userRole: user.role,
    action: action as ResourceActivityAction,
    courseId: courseId || undefined,
    lessonId: lessonId || undefined,
  });

  const updatedResource = db.getLibraryResourceById(req.params.id, orgId);

  res.json({
    activity,
    resource: updatedResource,
  });
});


