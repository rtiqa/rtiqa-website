import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';

export const lessonRouter = express.Router();

lessonRouter.use(requireAuth);

// GET /api/v1/lessons/course/:courseId
lessonRouter.get('/course/:courseId', (req: PlatformRequest, res: express.Response) => {
  try {
    const course = db.getCourseById(req.params.courseId, req.organization!.id);
    if (!course) return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND', message: 'المقرر غير موجود' });

    if (req.user!.role === 'STUDENT' && course.classroomId !== req.user!.classroomId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح لك بالوصول لهذا المقرر' });
    }

    const lessons = db.getLessonsByCourse(req.params.courseId, req.organization!.id);
    const filtered = req.user!.role === 'STUDENT' ? lessons.filter((l) => l.isPublished) : lessons;
    res.json({ success: true, data: filtered });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/lessons/:id
lessonRouter.get('/:id', (req: PlatformRequest, res: express.Response) => {
  try {
    const lesson = db.getLessonById(req.params.id, req.organization!.id);
    if (!lesson) return res.status(404).json({ success: false, error: 'LESSON_NOT_FOUND', message: 'الدرس غير موجود' });

    const course = db.getCourseById(lesson.courseId, req.organization!.id);
    if (!course) return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND' });

    if (req.user!.role === 'STUDENT') {
      if (course.classroomId !== req.user!.classroomId || !lesson.isPublished) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'الدرس غير متاح حالياً' });
      }
    }

    res.json({ success: true, data: lesson });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/lessons
lessonRouter.post('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { courseId, title, contentHtml, mediaUrl, attachments, orderIndex, isPublished } = req.body;
    if (!courseId || !title || !contentHtml) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'المقرر وعنوان الدرس والمحتوى مطلوبين' });
    }

    const course = db.getCourseById(courseId, req.organization!.id);
    if (!course) {
      return res.status(400).json({ success: false, error: 'INVALID_COURSE', message: 'المقرر غير موجود في المؤسسة' });
    }

    if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'لا يمكنك إضافة دروس لمقرر لا تدرسه' });
    }

    const lesson = db.createLesson({
      organizationId: req.organization!.id,
      courseId,
      title: String(title).trim(),
      contentHtml,
      mediaUrl: mediaUrl ? String(mediaUrl).trim() : undefined,
      attachments: attachments || [],
      orderIndex: Number(orderIndex) || 1,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    });

    res.json({ success: true, data: lesson });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// PUT /api/v1/lessons/:id
lessonRouter.put('/:id', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const lesson = db.getLessonById(req.params.id, req.organization!.id);
    if (!lesson) return res.status(404).json({ success: false, error: 'LESSON_NOT_FOUND', message: 'الدرس غير موجود' });

    const course = db.getCourseById(lesson.courseId, req.organization!.id);
    if (req.user!.role === 'TEACHER' && course && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بتعديل هذا الدرس' });
    }

    const updated = db.updateLesson(req.params.id, req.organization!.id, req.body);
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// DELETE /api/v1/lessons/:id
lessonRouter.delete('/:id', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const lesson = db.getLessonById(req.params.id, req.organization!.id);
    if (!lesson) return res.status(404).json({ success: false, error: 'LESSON_NOT_FOUND', message: 'الدرس غير موجود' });

    const course = db.getCourseById(lesson.courseId, req.organization!.id);
    if (req.user!.role === 'TEACHER' && course && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بحذف هذا الدرس' });
    }

    db.deleteLesson(req.params.id, req.organization!.id);
    res.json({ success: true, message: 'Lesson deleted' });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
