import express from 'express';
import { db } from '../db';
import { PlatformRequest, requireAuth, requireRoles } from '../auth';

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

    // Student
    const myCourses = db.getCourses(orgId).filter((c) => c.classroomId === user.classroomId);
    const mySubmissions = db.getSubmissionsByStudent(user.id, orgId);
    const allAssignments = db.getAssignmentsByOrg(orgId).filter((a) => myCourses.some((c) => c.id === a.courseId));

    const pendingAssignments = allAssignments.filter((a) => !mySubmissions.some((s) => s.assignmentId === a.id));
    const gradedSubmissions = mySubmissions.filter((s) => s.score !== undefined);

    let earnedTotal = 0;
    let maxTotal = 0;
    gradedSubmissions.forEach((s) => {
      const asg = db.getAssignmentById(s.assignmentId, orgId);
      if (asg && s.score !== undefined) {
        earnedTotal += s.score;
        maxTotal += asg.maxScore;
      }
    });

    const gpaPercent = maxTotal > 0 ? Math.round((earnedTotal / maxTotal) * 100) : 95;

    return res.json({
      success: true,
      data: {
        role: 'STUDENT',
        enrolledCoursesCount: myCourses.length,
        pendingAssignmentsCount: pendingAssignments.length,
        completedAssignmentsCount: mySubmissions.length,
        gpaPercent,
        myCourses,
        upcomingAssignments: pendingAssignments.slice(0, 4),
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
