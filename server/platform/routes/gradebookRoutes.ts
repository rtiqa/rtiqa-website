import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';
import type { AssessmentCategory, AssessmentStatus } from '../types.ts';

export const gradebookRouter = express.Router();

gradebookRouter.use(requireAuth);

// ========================================================
// Assessments Management (Quizzes, Midterms, Finals, HW, etc.)
// ========================================================

// GET /api/v1/gradebook/assessments
gradebookRouter.get('/assessments', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const courseId = req.query.courseId as string | undefined;
    const classroomId = req.query.classroomId as string | undefined;
    const termId = req.query.termId as string | undefined;
    const category = req.query.category as AssessmentCategory | undefined;
    const status = req.query.status as AssessmentStatus | undefined;

    let assessments = db.getAssessments(orgId, { courseId, classroomId, termId, category, status });

    // Scoping for teachers: only show assessments for courses assigned to them
    if (req.user!.role === 'TEACHER') {
      const myAssignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id });
      const allowedCourseIds = new Set(myAssignments.map((a) => a.courseId).filter(Boolean));
      assessments = assessments.filter(
        (a) => a.createdBy === req.user!.id || (a.courseId && allowedCourseIds.has(a.courseId))
      );
    } else if (req.user!.role === 'STUDENT') {
      // Students only see PUBLISHED or CLOSED assessments for their classroom
      const student = db.getUserById(req.user!.id, orgId);
      if (student?.classroomId) {
        assessments = assessments.filter(
          (a) => (!a.classroomId || a.classroomId === student.classroomId) && a.status !== 'DRAFT'
        );
      }
    }

    res.json({ success: true, data: assessments });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/gradebook/assessments
gradebookRouter.post('/assessments', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const { title, courseId, subjectId, classroomId, termId, category, maxScore, weightPercentage, dueDate, description, status } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'عنوان التقييم ومعرف المقرر مطلوبان' });
    }

    const course = db.getCourseById(courseId, orgId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND', message: 'المقرر غير موجود في المؤسسة' });
    }

    if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
      const assignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id, courseId });
      if (assignments.length === 0) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بإنشاء تقييم لهذا المقرر' });
      }
    }

    const assessment = await db.createAssessment({
      organizationId: orgId,
      title: String(title).trim(),
      courseId,
      subjectId: subjectId || course.subjectId,
      classroomId: classroomId || course.classroomId,
      termId: termId || course.termId,
      category: category || 'HOMEWORK',
      maxScore: Number(maxScore) || 100,
      weightPercentage: weightPercentage !== undefined ? Number(weightPercentage) : undefined,
      dueDate: dueDate || undefined,
      description: description ? String(description).trim() : undefined,
      status: status || 'PUBLISHED',
      createdBy: req.user!.id,
    });

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'CREATE_ASSESSMENT',
      'Assessment',
      assessment.id,
      { title: assessment.title, courseId, maxScore: assessment.maxScore }
    );

    res.status(201).json({ success: true, data: assessment });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/gradebook/assessments/:id
gradebookRouter.get('/assessments/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const assessment = db.getAssessmentById(req.params.id, orgId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'التقييم غير موجود' });
    }

    res.json({ success: true, data: assessment });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// PATCH /api/v1/gradebook/assessments/:id
gradebookRouter.patch('/assessments/:id', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const assessment = db.getAssessmentById(req.params.id, orgId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'التقييم غير موجود' });
    }

    if (req.user!.role === 'TEACHER' && assessment.createdBy !== req.user!.id) {
      const assignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id, courseId: assessment.courseId });
      if (assignments.length === 0) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بتعديل هذا التقييم' });
      }
    }

    const updated = await db.updateAssessment(req.params.id, orgId, req.body);

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'UPDATE_ASSESSMENT',
      'Assessment',
      assessment.id,
      { updates: req.body }
    );

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// DELETE /api/v1/gradebook/assessments/:id
gradebookRouter.delete('/assessments/:id', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const assessment = db.getAssessmentById(req.params.id, orgId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'التقييم غير موجود' });
    }

    if (req.user!.role === 'TEACHER' && assessment.createdBy !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'لا يمكن حذف تقييم أنشأه مستخدم آخر' });
    }

    await db.deleteAssessment(req.params.id, orgId);

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'DELETE_ASSESSMENT',
      'Assessment',
      assessment.id
    );

    res.json({ success: true, message: 'تم حذف التقييم وسجل درجاته بنجاح' });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ========================================================
// Assessment Grades & Roster Scoring
// ========================================================

// GET /api/v1/gradebook/assessments/:id/grades (All student scores for this assessment)
gradebookRouter.get('/assessments/:id/grades', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const assessment = db.getAssessmentById(req.params.id, orgId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'التقييم غير موجود' });
    }

    const course = db.getCourseById(assessment.courseId, orgId);
    const students = course?.classroomId
      ? db.getStudentsByClassroom(course.classroomId, orgId)
      : db.getUsersByOrg(orgId, 'STUDENT');

    const grades = db.getAssessmentGrades(orgId, { assessmentId: assessment.id });
    const gradesMap = new Map(grades.map((g) => [g.studentId, g]));

    const roster = students.map((std) => {
      const g = gradesMap.get(std.id);
      return {
        studentId: std.id,
        studentName: std.fullName,
        studentIdNumber: std.studentIdNumber,
        score: g?.score,
        percentage: g?.percentage,
        feedback: g?.feedback,
        gradedAt: g?.gradedAt,
        gradedByName: g?.gradedByName,
        status: g ? 'GRADED' : 'UNGRADED',
      };
    });

    res.json({
      success: true,
      data: {
        assessment,
        roster,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/gradebook/assessments/:id/grades (Batch save grades for an assessment)
gradebookRouter.post('/assessments/:id/grades', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const assessment = db.getAssessmentById(req.params.id, orgId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'التقييم غير موجود' });
    }

    const { grades } = req.body;
    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({ success: false, error: 'NO_GRADES', message: 'قائمة الدرجات فارغة' });
    }

    const preparedGrades = grades.map((g: { studentId: string; score: number; feedback?: string }) => ({
      organizationId: orgId,
      assessmentId: assessment.id,
      studentId: g.studentId,
      score: Math.max(0, Math.min(assessment.maxScore, Number(g.score) || 0)),
      maxScore: assessment.maxScore,
      feedback: g.feedback ? String(g.feedback).trim() : undefined,
      gradedBy: req.user!.id,
    }));

    const saved = await db.recordAssessmentGradesBatch(orgId, preparedGrades);

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'RECORD_ASSESSMENT_GRADES',
      'Assessment',
      assessment.id,
      { count: saved.length }
    );

    res.json({ success: true, data: saved, message: 'تم رصد وحفظ الدرجات بنجاح' });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ========================================================
// Gradebook Matrix & Summaries
// ========================================================

// GET /api/v1/gradebook (Holistic matrix view for a course)
gradebookRouter.get('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const courseId = req.query.courseId as string | undefined;

    if (!courseId) {
      return res.status(400).json({ success: false, error: 'COURSE_ID_REQUIRED', message: 'معرف المقرر مطلوب لعرض سجل الدرجات' });
    }

    const matrix = db.getGradebookMatrix(courseId, orgId);
    if (!matrix) {
      return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND', message: 'المقرر غير موجود في المؤسسة' });
    }

    // Role check for teachers
    if (req.user!.role === 'TEACHER' && matrix.course.teacherId !== req.user!.id) {
      const assignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id, courseId });
      if (assignments.length === 0) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'هذا المقرر ليس مسنداً إليك' });
      }
    }

    res.json({
      success: true,
      data: matrix,
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/gradebook/export-csv (Export holistic assessment matrix)
gradebookRouter.get('/export-csv', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const courseId = req.query.courseId as string | undefined;

    if (!courseId) {
      return res.status(400).json({ success: false, error: 'COURSE_ID_REQUIRED' });
    }

    const matrix = db.getGradebookMatrix(courseId, orgId);
    if (!matrix) {
      return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND' });
    }

    const headers = [
      'اسم الطالب (Student Name)',
      'الرقم الأكاديمي (Student ID)',
      ...matrix.assessments.map((a) => `${a.title} [${a.category}] (Max: ${a.maxScore})`),
      'المجموع المكتسب (Total Earned)',
      'المجموع الكلي (Total Max)',
      'النسبة المئوية (%)',
      'التقدير (Letter Grade)',
    ];

    const rows = [headers.join(',')];

    matrix.students.forEach((std) => {
      const scores = matrix.assessments.map((a) => {
        const item = std.scores[a.id];
        return item?.score !== undefined ? String(item.score) : 'N/A';
      });

      rows.push(
        [
          `"${std.studentName}"`,
          std.studentIdNumber || '',
          ...scores,
          std.totalEarned,
          std.totalMax,
          `${std.percentage}%`,
          std.letterGrade,
        ].join(',')
      );
    });

    const csvContent = rows.join('\n');
    res.json({ success: true, csv: csvContent, fileName: `gradebook_${matrix.course.title}.csv` });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/gradebook/student/:studentId/performance (Holistic student performance summary)
gradebookRouter.get('/student/:studentId/performance', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const targetStudentId = req.params.studentId;

    // RBAC & Tenant Privacy Scoping
    if (req.user!.role === 'STUDENT' && req.user!.id !== targetStudentId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالاطلاع على أداء طالب آخر' });
    }

    if (req.user!.role === 'PARENT') {
      const links = db.getParentStudentLinks(orgId, { parentId: req.user!.id });
      const hasAccess = links.some((l) => l.studentId === targetStudentId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالاطلاع على أداء هذا الطالب' });
      }
    }

    const performance = db.getStudentAcademicPerformance(targetStudentId, orgId);
    res.json({ success: true, data: performance });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/gradebook/my-grades (Direct student view for current student)
gradebookRouter.get('/my-grades', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    let targetStudentId = req.user!.id;

    if (req.user!.role !== 'STUDENT' && req.query.studentId) {
      targetStudentId = req.query.studentId as string;
    }

    const studentUser = db.getUserById(targetStudentId, orgId);
    const performance = db.getStudentAcademicPerformance(targetStudentId, orgId);
    res.json({
      success: true,
      data: {
        ...performance,
        student: studentUser
          ? {
              id: studentUser.id,
              fullName: studentUser.fullName,
              email: studentUser.email,
              role: studentUser.role,
              studentIdNumber: studentUser.studentIdNumber,
            }
          : { id: targetStudentId, fullName: performance.studentName },
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
