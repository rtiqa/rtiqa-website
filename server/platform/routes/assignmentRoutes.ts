import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';

export const assignmentRouter = express.Router();

assignmentRouter.use(requireAuth);

// GET /api/v1/assignments (Filter by courseId or get all for user)
assignmentRouter.get('/', (req: PlatformRequest, res: express.Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    let list = courseId
      ? db.getAssignmentsByCourse(courseId, req.organization!.id)
      : db.getAssignmentsByOrg(req.organization!.id);

    // If student, filter only to assignments for courses in student's classroom
    if (req.user!.role === 'STUDENT') {
      const studentCourses = db.getCourses(req.organization!.id).filter((c) => c.classroomId === req.user!.classroomId);
      const studentCourseIds = new Set(studentCourses.map((c) => c.id));
      list = list.filter((a) => studentCourseIds.has(a.courseId));

      const studentSubmissions = db.getSubmissionsByStudent(req.user!.id, req.organization!.id);
      const mapped = list.map((asg) => {
        const sub = studentSubmissions.find((s) => s.assignmentId === asg.id);
        return {
          ...asg,
          mySubmission: sub || null,
        };
      });
      return res.json({ success: true, data: mapped });
    }

    // If teacher, filter only to courses taught by them unless admin
    if (req.user!.role === 'TEACHER') {
      const myCourses = db.getCourses(req.organization!.id, req.user!.id);
      const myCourseIds = new Set(myCourses.map((c) => c.id));
      list = list.filter((a) => myCourseIds.has(a.courseId));
    }

    const mapped = list.map((asg) => {
      const subs = db.getSubmissionsByAssignment(asg.id, req.organization!.id);
      const gradedCount = subs.filter((s) => s.score !== undefined).length;
      return {
        ...asg,
        submissionsCount: subs.length,
        gradedCount,
      };
    });

    res.json({ success: true, data: mapped });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/assignments/:id
assignmentRouter.get('/:id', (req: PlatformRequest, res: express.Response) => {
  try {
    const asg = db.getAssignmentById(req.params.id, req.organization!.id);
    if (!asg) return res.status(404).json({ success: false, error: 'ASSIGNMENT_NOT_FOUND', message: 'الواجب غير موجود' });

    const course = db.getCourseById(asg.courseId, req.organization!.id);
    if (!course) return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND' });

    if (req.user!.role === 'STUDENT') {
      if (course.classroomId !== req.user!.classroomId) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح لك بالوصول لهذا الواجب' });
      }
      const mySub = db.getSubmissionByStudent(asg.id, req.user!.id, req.organization!.id);
      return res.json({ success: true, data: { ...asg, mySubmission: mySub || null } });
    }

    if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'هذا الواجب يتبع لمقرر لا تدرسه' });
    }

    const submissions = db.getSubmissionsByAssignment(asg.id, req.organization!.id);
    res.json({ success: true, data: { ...asg, submissions } });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/assignments (Create assignment)
assignmentRouter.post('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { courseId, title, description, maxScore, dueDate, attachments } = req.body;
    if (!courseId || !title || !maxScore || !dueDate) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'المقرر وعنوان الواجب والدرجة وتاريخ التسليم مطلوبين' });
    }

    const course = db.getCourseById(courseId, req.organization!.id);
    if (!course) {
      return res.status(400).json({ success: false, error: 'INVALID_COURSE', message: 'المقرر غير موجود في المؤسسة' });
    }

    if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'لا يمكنك إضافة واجب لمقرر لا تدرسه' });
    }

    const numericMaxScore = Number(maxScore);
    if (isNaN(numericMaxScore) || numericMaxScore <= 0) {
      return res.status(400).json({ success: false, error: 'INVALID_MAX_SCORE', message: 'درجة الواجب يجب أن تكون رقماً موجباً' });
    }

    const asg = db.createAssignment({
      organizationId: req.organization!.id,
      courseId,
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      maxScore: numericMaxScore,
      dueDate,
      attachments: attachments || [],
    });

    res.json({ success: true, data: asg });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/assignments/:id/submit (Student submit)
assignmentRouter.post('/:id/submit', requireRoles(['STUDENT']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { submissionText, fileAttachmentUrl } = req.body;
    if (!submissionText && !fileAttachmentUrl) {
      return res.status(400).json({ success: false, error: 'CONTENT_REQUIRED', message: 'يرجى كتابة الإجابة أو إرفاق ملف' });
    }

    const asg = db.getAssignmentById(req.params.id, req.organization!.id);
    if (!asg) return res.status(404).json({ success: false, error: 'ASSIGNMENT_NOT_FOUND', message: 'الواجب غير موجود' });

    const course = db.getCourseById(asg.courseId, req.organization!.id);
    if (!course || course.classroomId !== req.user!.classroomId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'لست مسجلاً في الشعبة المخصصة لهذا الواجب' });
    }

    const submission = db.submitAssignment({
      organizationId: req.organization!.id,
      assignmentId: asg.id,
      studentId: req.user!.id,
      submissionText: submissionText ? String(submissionText).trim() : '',
      fileAttachmentUrl: fileAttachmentUrl ? String(fileAttachmentUrl).trim() : '',
    });

    res.json({ success: true, data: submission });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// PUT /api/v1/assignments/submissions/:submissionId/grade (Teacher grade)
assignmentRouter.put('/submissions/:submissionId/grade', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { score, teacherFeedback } = req.body;
    const numScore = Number(score);
    if (score === undefined || isNaN(numScore) || numScore < 0) {
      return res.status(400).json({ success: false, error: 'VALID_SCORE_REQUIRED', message: 'يرجى إدخال درجة صحيحة وغير سالبة' });
    }

    const graded = db.gradeSubmission(req.params.submissionId, req.organization!.id, numScore, teacherFeedback);
    if (!graded) return res.status(404).json({ success: false, error: 'SUBMISSION_NOT_FOUND', message: 'التسليم غير موجود' });

    res.json({ success: true, data: graded });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
