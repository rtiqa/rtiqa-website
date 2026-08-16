import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';

export const courseRouter = express.Router();

courseRouter.use(requireAuth);

// GET /api/v1/courses (Filtered by role: teachers see assigned, students see classroom courses, admins see all)
courseRouter.get('/', (req: PlatformRequest, res: express.Response) => {
  try {
    const { role, id: userId, classroomId } = req.user!;
    let courses = db.getCourses(req.organization!.id);

    if (role === 'TEACHER') {
      courses = courses.filter((c) => c.teacherId === userId);
    } else if (role === 'STUDENT') {
      courses = classroomId ? courses.filter((c) => c.classroomId === classroomId) : [];
    }

    res.json({ success: true, data: courses });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/courses/:id
courseRouter.get('/:id', (req: PlatformRequest, res: express.Response) => {
  try {
    const course = db.getCourseById(req.params.id, req.organization!.id);
    if (!course) return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND', message: 'المقرر غير موجود' });

    // Role-based access check
    if (req.user!.role === 'STUDENT' && course.classroomId !== req.user!.classroomId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'لا تملك صلاحية الوصول لهذا المقرر' });
    }
    if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'هذا المقرر ليس مسنداً إليك' });
    }

    const lessons = db.getLessonsByCourse(course.id, req.organization!.id);
    const filteredLessons = req.user!.role === 'STUDENT' ? lessons.filter((l) => l.isPublished) : lessons;
    const assignments = db.getAssignmentsByCourse(course.id, req.organization!.id);
    const students = db.getUsersByOrg(req.organization!.id, 'STUDENT').filter((s) => s.classroomId === course.classroomId);

    res.json({
      success: true,
      data: {
        ...course,
        lessons: filteredLessons,
        assignments,
        studentsCount: students.length,
        students: students.map((s) => ({ id: s.id, fullName: s.fullName, studentIdNumber: s.studentIdNumber, email: s.email })),
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/courses (Admins & Teachers can create)
courseRouter.post('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { subjectId, termId, classroomId, title, description, teacherId } = req.body;
    if (!subjectId || !termId || !classroomId || !title) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'المادة والفصل والشعبة وعنوان المقرر مطلوبة' });
    }

    const orgId = req.organization!.id;

    // Validate foreign keys in same tenant
    if (!db.isSubjectInOrg(subjectId, orgId)) {
      return res.status(400).json({ success: false, error: 'INVALID_SUBJECT', message: 'المادة غير صالحة' });
    }
    if (!db.isTermInOrg(termId, orgId)) {
      return res.status(400).json({ success: false, error: 'INVALID_TERM', message: 'الفصل الدراسي غير صالح' });
    }
    if (!db.isClassroomInOrg(classroomId, orgId)) {
      return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية غير صالحة' });
    }

    let assignedTeacherId = req.user!.id;
    if (req.user!.role === 'ORG_ADMIN' || req.user!.role === 'SUPER_ADMIN') {
      if (teacherId) {
        const t = db.getUserById(teacherId, orgId);
        if (!t || (t.role !== 'TEACHER' && t.role !== 'ORG_ADMIN')) {
          return res.status(400).json({ success: false, error: 'INVALID_TEACHER', message: 'المعلم المحدد غير موجود' });
        }
        assignedTeacherId = t.id;
      }
    }

    const course = db.createCourse({
      organizationId: orgId,
      subjectId,
      termId,
      classroomId,
      title: String(title).trim(),
      description: description ? String(description).trim() : undefined,
      teacherId: assignedTeacherId,
    });

    res.json({ success: true, data: course });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
