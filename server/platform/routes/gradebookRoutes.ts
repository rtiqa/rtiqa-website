import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';

export const gradebookRouter = express.Router();

gradebookRouter.use(requireAuth);

// GET /api/v1/gradebook (Matrix view for a course: list of students, assignments, and submitted scores)
gradebookRouter.get('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    if (!courseId) {
      return res.status(400).json({ success: false, error: 'COURSE_ID_REQUIRED', message: 'معرف المقرر مطلوب' });
    }

    const course = db.getCourseById(courseId, req.organization!.id);
    if (!course) return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND', message: 'المقرر غير موجود' });

    // If teacher, verify course is taught by them
    if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'هذا المقرر ليس مسنداً إليك' });
    }

    const assignments = db.getAssignmentsByCourse(courseId, req.organization!.id);
    const students = db.getUsersByOrg(req.organization!.id, 'STUDENT').filter((s) => s.classroomId === course.classroomId);

    const matrix = students.map((student) => {
      const studentSubs = db.getSubmissionsByStudent(student.id, req.organization!.id);
      const scores: Record<string, { score?: number; maxScore: number; feedback?: string; submittedAt?: string }> = {};

      let totalEarned = 0;
      let totalMax = 0;

      assignments.forEach((asg) => {
        const sub = studentSubs.find((s) => s.assignmentId === asg.id);
        scores[asg.id] = {
          score: sub?.score,
          maxScore: asg.maxScore,
          feedback: sub?.teacherFeedback,
          submittedAt: sub?.submittedAt,
        };

        if (sub?.score !== undefined) {
          totalEarned += sub.score;
          totalMax += asg.maxScore;
        }
      });

      const averagePercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

      return {
        studentId: student.id,
        studentName: student.fullName,
        studentIdNumber: student.studentIdNumber,
        scores,
        totalEarned,
        totalMax,
        averagePercent,
      };
    });

    res.json({
      success: true,
      data: {
        course,
        assignments: assignments.map((a) => ({ id: a.id, title: a.title, maxScore: a.maxScore, dueDate: a.dueDate })),
        matrix,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/gradebook/export-csv
gradebookRouter.get('/export-csv', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    if (!courseId) {
      return res.status(400).json({ success: false, error: 'COURSE_ID_REQUIRED' });
    }

    const course = db.getCourseById(courseId, req.organization!.id);
    if (!course) return res.status(404).json({ success: false, error: 'COURSE_NOT_FOUND' });

    if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN' });
    }

    const assignments = db.getAssignmentsByCourse(courseId, req.organization!.id);
    const students = db.getUsersByOrg(req.organization!.id, 'STUDENT').filter((s) => s.classroomId === course.classroomId);

    const headers = ['Student Name', 'Student ID', ...assignments.map((a) => `${a.title} (Max: ${a.maxScore})`), 'Total Earned', 'Total Max', 'Average %'];
    const rows = [headers.join(',')];

    students.forEach((std) => {
      const subs = db.getSubmissionsByStudent(std.id, req.organization!.id);
      let earned = 0;
      let totalMax = 0;

      const scores = assignments.map((a) => {
        const s = subs.find((sub) => sub.assignmentId === a.id);
        if (s?.score !== undefined) {
          earned += s.score;
          totalMax += a.maxScore;
          return s.score.toString();
        }
        totalMax += a.maxScore;
        return 'N/A';
      });

      const avg = totalMax > 0 ? Math.round((earned / totalMax) * 100) : 0;
      rows.push([`"${std.fullName}"`, std.studentIdNumber || '', ...scores, earned, totalMax, `${avg}%`].join(','));
    });

    const csvContent = rows.join('\n');
    res.json({ success: true, csv: csvContent });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

gradebookRouter.get('/my-grades', (req: PlatformRequest, res: express.Response) => {
  try {
    // For students, strictly enforce their own ID (prevents inspecting other students)
    let targetStudentId = req.user!.id;

    if (req.user!.role !== 'STUDENT') {
      targetStudentId = (req.query.studentId as string) || req.user!.id;
    }

    const student = db.getUserById(targetStudentId, req.organization!.id);
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ success: false, error: 'STUDENT_NOT_FOUND', message: 'الطالب غير موجود في المؤسسة' });
    }

    const courses = db.getCourses(req.organization!.id).filter((c) => c.classroomId === student.classroomId);
    const submissions = db.getSubmissionsByStudent(targetStudentId, req.organization!.id);

    const breakdown = courses.map((course) => {
      const asgs = db.getAssignmentsByCourse(course.id, req.organization!.id);
      let earned = 0;
      let max = 0;

      const items = asgs.map((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        if (sub?.score !== undefined) {
          earned += sub.score;
          max += a.maxScore;
        }
        return {
          assignmentId: a.id,
          title: a.title,
          maxScore: a.maxScore,
          score: sub?.score,
          feedback: sub?.teacherFeedback,
          submittedAt: sub?.submittedAt,
          status: sub ? (sub.score !== undefined ? 'GRADED' : 'SUBMITTED') : 'PENDING',
        };
      });

      const average = max > 0 ? Math.round((earned / max) * 100) : 0;
      return {
        courseId: course.id,
        courseTitle: course.title,
        subjectName: course.subjectName,
        teacherName: course.teacherName,
        earned,
        max,
        average,
        items,
      };
    });

    res.json({
      success: true,
      data: {
        student: { id: student.id, fullName: student.fullName, studentIdNumber: student.studentIdNumber },
        breakdown,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
