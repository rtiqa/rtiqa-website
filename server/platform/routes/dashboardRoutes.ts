import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';

export const dashboardRouter = express.Router();

dashboardRouter.use(requireAuth);

// GET /api/v1/dashboard/stats (Role-adaptive aggregated metrics)
dashboardRouter.get('/stats', (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const user = req.user!;

    if (user.role === 'ORG_ADMIN' || user.role === 'SUPER_ADMIN') {
      const students = db.getUsersByOrg(orgId, 'STUDENT');
      const teachers = db.getUsersByOrg(orgId, 'TEACHER');
      const classrooms = db.getClassrooms(orgId);
      const courses = db.getCourses(orgId);
      const assignments = db.getAssignmentsByOrg(orgId);
      const attendance = db.getAttendance(orgId);

      const totalAtt = attendance.length;
      const presentAtt = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 96;

      return res.json({
        success: true,
        data: {
          role: 'ORG_ADMIN',
          totalStudents: students.length,
          totalTeachers: teachers.length,
          totalClassrooms: classrooms.length,
          totalCourses: courses.length,
          totalAssignments: assignments.length,
          attendanceRate,
          recentLogs: db.getAuditLogs(orgId, 5),
        },
      });
    }

    if (user.role === 'TEACHER') {
      const myCourses = db.getCourses(orgId, user.id);
      let totalStudents = 0;
      const courseIds = myCourses.map((c) => c.id);

      myCourses.forEach((c) => {
        const stds = db.getUsersByOrg(orgId, 'STUDENT').filter((s) => s.classroomId === c.classroomId);
        totalStudents += stds.length;
      });

      const myAssignments = db.getAssignmentsByOrg(orgId).filter((a) => courseIds.includes(a.courseId));
      let pendingGrading = 0;

      myAssignments.forEach((a) => {
        const subs = db.getSubmissionsByAssignment(a.id, orgId);
        const unGraded = subs.filter((s) => s.score === undefined).length;
        pendingGrading += unGraded;
      });

      return res.json({
        success: true,
        data: {
          role: 'TEACHER',
          activeCoursesCount: myCourses.length,
          totalEnrolledStudents: totalStudents,
          totalAssignmentsCount: myAssignments.length,
          pendingGradingCount: pendingGrading,
          myCourses,
        },
      });
    }

    if (user.role === 'PARENT') {
      const links = db.getParentStudentLinks(orgId, { parentId: user.id });
      const childrenSummaries = links.map((link) => {
        const studentUser = db.getUserById(link.studentId, orgId);
        const performance = db.getStudentAcademicPerformance(link.studentId, orgId);
        const attendance = db.getAttendanceSummaryForStudent(link.studentId, orgId);
        const behaviorRecords = db.getStudentBehaviorRecords(orgId, { studentId: link.studentId });
        const behaviorPoints = behaviorRecords.reduce((sum, b) => sum + (b.points || 0), 0);

        return {
          linkId: link.id,
          studentId: link.studentId,
          studentName: studentUser?.fullName || link.studentName || 'طالب',
          relationship: link.relationship,
          isEmergencyContact: link.isEmergencyContact,
          classroomId: studentUser?.classroomId,
          gpaPercent: performance.overallGpaPercent,
          letterGrade: performance.letterGrade,
          attendanceRate: attendance.attendanceRate,
          behaviorPoints,
          activeCoursesCount: performance.courses.length,
        };
      });

      return res.json({
        success: true,
        data: {
          role: 'PARENT',
          linkedChildrenCount: links.length,
          children: childrenSummaries,
        },
      });
    }

    // Student
    const academicPerformance = db.getStudentAcademicPerformance(user.id, orgId);
    const attendanceSummary = db.getAttendanceSummaryForStudent(user.id, orgId);

    const myCourses = academicPerformance.courses.map((c) => {
      const fullCourse = db.getCourseById(c.courseId, orgId);
      return fullCourse || {
        id: c.courseId,
        title: c.courseTitle,
        subjectId: c.subjectId,
        subjectName: c.subjectName,
        teacherName: c.teacherName,
        classroomName: c.classroomName,
      };
    });

    const mySubmissions = db.getSubmissionsByStudent(user.id, orgId);
    const allAssignments = db.getAssignmentsByOrg(orgId).filter((a) => myCourses.some((c) => c.id === a.courseId));
    const pendingAssignments = allAssignments.filter((a) => !mySubmissions.some((s) => s.assignmentId === a.id));

    // Assessments upcoming
    const allAssessments = db.getAssessments(orgId).filter((ass) => myCourses.some((c) => c.id === ass.courseId) && ass.status !== 'DRAFT');
    const myGrades = db.getAssessmentGrades(orgId, { studentId: user.id });
    const pendingAssessments = allAssessments.filter((ass) => !myGrades.some((g) => g.assessmentId === ass.id));

    return res.json({
      success: true,
      data: {
        role: 'STUDENT',
        enrolledCoursesCount: myCourses.length,
        pendingAssignmentsCount: pendingAssignments.length + pendingAssessments.length,
        completedAssignmentsCount: mySubmissions.length + myGrades.length,
        gpaPercent: academicPerformance.overallGpaPercent,
        letterGrade: academicPerformance.letterGrade,
        attendanceRate: attendanceSummary.attendanceRate,
        attendanceSummary,
        academicPerformance,
        myCourses,
        upcomingAssignments: [
          ...pendingAssignments.slice(0, 3).map((a) => ({ id: a.id, title: a.title, type: 'ASSIGNMENT', dueDate: a.dueDate, maxScore: a.maxScore })),
          ...pendingAssessments.slice(0, 3).map((a) => ({ id: a.id, title: a.title, type: a.category, dueDate: a.dueDate, maxScore: a.maxScore })),
        ],
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/dashboard/organization
dashboardRouter.get('/organization', (req: PlatformRequest, res: express.Response) => {
  try {
    res.json({ success: true, data: req.organization });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// PUT /api/v1/dashboard/organization (Admin only)
dashboardRouter.put('/organization', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const org = req.organization!;
    const { name, legalName, timezone, locale, logoUrl } = req.body;
    if (name) org.name = String(name).trim();
    if (legalName) org.legalName = String(legalName).trim();
    if (timezone) org.timezone = String(timezone).trim();
    if (locale === 'ar' || locale === 'en') org.locale = locale;
    if (logoUrl !== undefined) org.logoUrl = String(logoUrl).trim();
    org.updatedAt = new Date().toISOString();

    db.logAction(org.id, req.user!.id, req.user!.email, 'UPDATE_ORG_SETTINGS', 'Organization', org.id);

    res.json({ success: true, data: org });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/dashboard/audit-logs
dashboardRouter.get('/audit-logs', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const logs = db.getAuditLogs(req.organization!.id, 50);
    res.json({ success: true, data: logs });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

/**
 * GET /api/v1/dashboard/analytics
 * Comprehensive academic analytics, risk detection, and intervention intelligence
 */
dashboardRouter.get(
  '/analytics',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const orgId = req.organization!.id;
      const students = db.getUsersByOrg(orgId, 'STUDENT');
      const courses = db.getCourses(orgId);

      let totalGpa = 0;
      let evaluatedStudentsCount = 0;
      const atRiskStudents: Array<{
        studentId: string;
        studentName: string;
        gpaPercent: number;
        attendanceRate: number;
        reason: string;
      }> = [];
      const topPerformers: Array<{
        studentId: string;
        studentName: string;
        gpaPercent: number;
        letterGrade: string;
      }> = [];

      for (const student of students) {
        const perf = db.getStudentAcademicPerformance(student.id, orgId);
        const att = db.getAttendanceSummaryForStudent(student.id, orgId);

        if (perf.enrolledCoursesCount > 0) {
          totalGpa += perf.overallGpaPercent;
          evaluatedStudentsCount++;

          if (perf.overallGpaPercent >= 90) {
            topPerformers.push({
              studentId: student.id,
              studentName: student.fullName,
              gpaPercent: perf.overallGpaPercent,
              letterGrade: perf.letterGrade,
            });
          }

          if (perf.overallGpaPercent < 70 || att.attendanceRate < 85) {
            let reason = '';
            if (perf.overallGpaPercent < 70 && att.attendanceRate < 85) {
              reason = 'انخفاض في التحصيل الأكاديمي ونسبة الحضور';
            } else if (perf.overallGpaPercent < 70) {
              reason = 'انخفاض المعدل التراكمي عن الحد الأدنى';
            } else {
              reason = 'تجاوز نسبة الغياب المسموح بها';
            }

            atRiskStudents.push({
              studentId: student.id,
              studentName: student.fullName,
              gpaPercent: perf.overallGpaPercent,
              attendanceRate: att.attendanceRate,
              reason,
            });
          }
        }
      }

      const averageGpa = evaluatedStudentsCount > 0 ? Math.round(totalGpa / evaluatedStudentsCount) : 85;

      const coursePerformance = courses.map((course) => {
        const grades = db.getAssessmentGrades(orgId).filter((g) => {
          const ass = db.getAssessmentById(g.assessmentId, orgId);
          return ass?.courseId === course.id;
        });

        const avgScore =
          grades.length > 0
            ? Math.round(grades.reduce((s, g) => s + g.percentage, 0) / grades.length)
            : 85;

        return {
          courseId: course.id,
          courseTitle: course.title,
          subjectName: course.subjectName,
          averageScore: avgScore,
          gradedItemsCount: grades.length,
        };
      });

      res.json({
        success: true,
        data: {
          averageGpa,
          totalStudentsCount: students.length,
          evaluatedStudentsCount,
          atRiskCount: atRiskStudents.length,
          topPerformersCount: topPerformers.length,
          atRiskStudents,
          topPerformers: topPerformers.slice(0, 10),
          coursePerformance,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'ANALYTICS_ERROR',
      });
    }
  }
);

