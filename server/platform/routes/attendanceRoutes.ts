import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';
import type { AttendanceSessionStatus } from '../types.ts';

export const attendanceRouter = express.Router();

attendanceRouter.use(requireAuth);

// ========================================================
// Attendance Sessions (Formal Session-Based Roll Calls)
// ========================================================

// GET /api/v1/attendance/sessions
attendanceRouter.get('/sessions', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const classroomId = req.query.classroomId as string | undefined;
    const courseId = req.query.courseId as string | undefined;
    const date = req.query.date as string | undefined;
    const status = req.query.status as AttendanceSessionStatus | undefined;

    let sessions = db.getAttendanceSessions(orgId, { classroomId, courseId, date, status });

    // Scoping for teachers: If TEACHER, filter sessions to their courses or assigned classrooms
    if (req.user!.role === 'TEACHER') {
      const myAssignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id });
      const allowedCourseIds = new Set(myAssignments.map((a) => a.courseId).filter(Boolean));
      const allowedClassroomIds = new Set(myAssignments.map((a) => a.classroomId).filter(Boolean));

      sessions = sessions.filter(
        (s) =>
          s.openedBy === req.user!.id ||
          (s.courseId && allowedCourseIds.has(s.courseId)) ||
          (s.classroomId && allowedClassroomIds.has(s.classroomId))
      );
    }

    res.json({ success: true, data: sessions });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/attendance/sessions (Create a new attendance roll call session)
attendanceRouter.post('/sessions', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const { classroomId, courseId, date, periodNumber, title, notes } = req.body;

    if (!classroomId) {
      return res.status(400).json({ success: false, error: 'MISSING_CLASSROOM', message: 'الشعبة الدراسية مطلوبة لفتح جلسة التحضير' });
    }

    if (!db.isClassroomInOrg(classroomId, orgId)) {
      return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية غير صالحة' });
    }

    if (courseId) {
      const course = db.getCourseById(courseId, orgId);
      if (!course) {
        return res.status(400).json({ success: false, error: 'INVALID_COURSE', message: 'المقرر الدراسي غير صالح' });
      }
      if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
        // Verify if teacher is assigned to this course
        const assignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id, courseId });
        if (assignments.length === 0) {
          return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح لك بفتح جلسة لهذا المقرر' });
        }
      }
    }

    const sessionDate = date || new Date().toISOString().split('T')[0];
    const classroom = db.getClassroomById(classroomId, orgId);
    const students = db.getStudentsByClassroom(classroomId, orgId);

    const newSession = await db.createAttendanceSession({
      organizationId: orgId,
      classroomId,
      classroomName: classroom?.name,
      courseId,
      date: sessionDate,
      periodNumber: periodNumber ? Number(periodNumber) : undefined,
      title: title || `تحضير ${classroom?.name || ''} - ${sessionDate}`,
      status: 'OPEN',
      openedBy: req.user!.id,
      notes,
      totalStudents: students.length,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0,
    });

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'CREATE_ATTENDANCE_SESSION',
      'AttendanceSession',
      newSession.id,
      { classroomId, courseId, date: sessionDate }
    );

    res.status(201).json({ success: true, data: newSession });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/attendance/sessions/:id (Session with student roll call records)
attendanceRouter.get('/sessions/:id', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const session = db.getAttendanceSessionById(req.params.id, orgId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'جلسة التحضير غير موجودة' });
    }

    // Role privacy check
    if (req.user!.role === 'TEACHER') {
      const myAssignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id });
      const allowedCourseIds = new Set(myAssignments.map((a) => a.courseId).filter(Boolean));
      const allowedClassroomIds = new Set(myAssignments.map((a) => a.classroomId).filter(Boolean));

      const isAllowed =
        session.openedBy === req.user!.id ||
        (session.courseId && allowedCourseIds.has(session.courseId)) ||
        (session.classroomId && allowedClassroomIds.has(session.classroomId));

      if (!isAllowed) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالاطلاع على هذه الجلسة' });
      }
    }

    // Fetch enrolled students and their attendance records for this session
    const students = session.classroomId ? db.getStudentsByClassroom(session.classroomId, orgId) : [];
    const records = db.getAttendanceRecords(orgId, { sessionId: session.id });
    const recordsByStudent = new Map(records.map((r) => [r.studentId, r]));

    const studentRoster = students.map((std) => {
      const rec = recordsByStudent.get(std.id);
      return {
        studentId: std.id,
        studentName: std.fullName,
        studentIdNumber: std.studentIdNumber,
        status: rec ? rec.status : 'PENDING',
        notes: rec?.notes || '',
        recordId: rec?.id,
      };
    });

    res.json({
      success: true,
      data: {
        session,
        roster: studentRoster,
        records,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/attendance/sessions/:id/roll-call (Submit complete roll-call for a session)
attendanceRouter.post('/sessions/:id/roll-call', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const session = db.getAttendanceSessionById(req.params.id, orgId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'جلسة التحضير غير موجودة' });
    }

    if (req.user!.role === 'TEACHER' && session.openedBy !== req.user!.id) {
      const assignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id });
      const allowed = assignments.some(
        (a) => (session.courseId && a.courseId === session.courseId) || (session.classroomId && a.classroomId === session.classroomId)
      );
      if (!allowed) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بتسجيل هذا التحضير' });
      }
    }

    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'EMPTY_RECORDS', message: 'قائمة رصد الحضور فارغة' });
    }

    const preparedRecords = records.map((r: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes?: string }) => ({
      organizationId: orgId,
      sessionId: session.id,
      courseId: session.courseId,
      classroomId: session.classroomId,
      studentId: r.studentId,
      recordedBy: req.user!.id,
      date: session.date,
      status: r.status || 'PRESENT',
      notes: r.notes ? String(r.notes).trim() : undefined,
    }));

    const saved = await db.recordAttendanceBatch(orgId, preparedRecords, session.id);

    // Auto mark session as COMPLETED once roll call is recorded
    await db.updateAttendanceSession(session.id, orgId, { status: 'COMPLETED' });

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'RECORD_SESSION_ROLL_CALL',
      'AttendanceSession',
      session.id,
      { count: saved.length, date: session.date }
    );

    res.json({ success: true, data: saved, message: 'تم رصد وتحديث سجل الحضور بنجاح' });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// DELETE /api/v1/attendance/sessions/:id
attendanceRouter.delete('/sessions/:id', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const session = db.getAttendanceSessionById(req.params.id, orgId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'جلسة التحضير غير موجودة' });
    }

    if (req.user!.role === 'TEACHER' && session.openedBy !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'لا يمكن حذف جلسة أنشأها معلم آخر' });
    }

    await db.deleteAttendanceSession(session.id, orgId);

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'DELETE_ATTENDANCE_SESSION',
      'AttendanceSession',
      session.id
    );

    res.json({ success: true, message: 'تم حذف جلسة التحضير بنجاح' });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ========================================================
// Attendance Records & Roll Calls
// ========================================================

// GET /api/v1/attendance (Scoping with student/parent isolation)
attendanceRouter.get('/', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const courseId = req.query.courseId as string | undefined;
    const classroomId = req.query.classroomId as string | undefined;
    const date = req.query.date as string | undefined;
    const studentIdParam = req.query.studentId as string | undefined;

    let records = db.getAttendanceRecords(orgId, {
      courseId,
      classroomId,
      date,
      studentId: studentIdParam,
    });

    // Privacy isolation
    if (req.user!.role === 'STUDENT') {
      records = records.filter((r) => r.studentId === req.user!.id);
    } else if (req.user!.role === 'PARENT') {
      const links = db.getParentStudentLinks(orgId, { parentId: req.user!.id });
      const childIds = new Set(links.map((l) => l.studentId));
      records = records.filter((r) => childIds.has(r.studentId));
    } else if (req.user!.role === 'TEACHER') {
      const myAssignments = db.getTeacherAssignments(orgId, { teacherId: req.user!.id });
      const allowedCourseIds = new Set(myAssignments.map((a) => a.courseId).filter(Boolean));
      const allowedClassroomIds = new Set(myAssignments.map((a) => a.classroomId).filter(Boolean));

      records = records.filter(
        (r) =>
          r.recordedBy === req.user!.id ||
          (r.courseId && allowedCourseIds.has(r.courseId)) ||
          (r.classroomId && allowedClassroomIds.has(r.classroomId))
      );
    }

    res.json({ success: true, data: records });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/attendance (Batch save individual roll-call)
attendanceRouter.post('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), async (req: PlatformRequest, res: express.Response) => {
  try {
    const { records, courseId, classroomId, date, sessionId } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'NO_RECORDS', message: 'قائمة الحضور فارغة' });
    }

    const orgId = req.organization!.id;

    if (courseId) {
      const course = db.getCourseById(courseId, orgId);
      if (!course) return res.status(400).json({ success: false, error: 'INVALID_COURSE', message: 'المقرر غير موجود في المؤسسة' });
      if (req.user!.role === 'TEACHER' && course.teacherId !== req.user!.id) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بتسجيل حضور لهذا المقرر' });
      }
    }

    if (classroomId && !db.isClassroomInOrg(classroomId, orgId)) {
      return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية غير موجودة في المؤسسة' });
    }

    const effectiveDate = date || new Date().toISOString().split('T')[0];

    // Validate students
    for (const r of records) {
      const std = db.getUserById(r.studentId, orgId);
      if (!std || std.role !== 'STUDENT') {
        return res.status(400).json({ success: false, error: 'INVALID_STUDENT', message: `الطالب (${r.studentId}) غير صالح في المؤسسة` });
      }
    }

    const prepared = records.map((r: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes?: string }) => ({
      organizationId: orgId,
      sessionId: sessionId || undefined,
      courseId: courseId || undefined,
      classroomId: classroomId || 'default',
      studentId: r.studentId,
      recordedBy: req.user!.id,
      date: effectiveDate,
      status: r.status || 'PRESENT',
      notes: r.notes ? String(r.notes).trim() : undefined,
    }));

    const saved = await db.recordAttendanceBatch(orgId, prepared, sessionId);

    db.logAction(
      orgId,
      req.user!.id,
      req.user!.email,
      'RECORD_ATTENDANCE',
      'Attendance',
      `${saved.length}_records`,
      { date: effectiveDate, courseId, count: saved.length }
    );

    res.json({ success: true, data: saved });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/attendance/student/:studentId (Individual student summary & full history)
attendanceRouter.get('/student/:studentId', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const targetStudentId = req.params.studentId;

    // Authorization checks
    if (req.user!.role === 'STUDENT' && req.user!.id !== targetStudentId) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالاطلاع على سجل طالب آخر' });
    }

    if (req.user!.role === 'PARENT') {
      const links = db.getParentStudentLinks(orgId, { parentId: req.user!.id });
      const hasAccess = links.some((l) => l.studentId === targetStudentId);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'غير مصرح بالاطلاع على سجل هذا الطالب' });
      }
    }

    const summary = db.getAttendanceSummaryForStudent(targetStudentId, orgId);
    res.json({ success: true, data: summary });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/attendance/summary (Organization or context-level metrics)
attendanceRouter.get('/summary', async (req: PlatformRequest, res: express.Response) => {
  try {
    const orgId = req.organization!.id;
    const studentId = req.user!.role === 'STUDENT' ? req.user!.id : (req.query.studentId as string | undefined);

    if (studentId) {
      const summary = db.getAttendanceSummaryForStudent(studentId, orgId);
      return res.json({ success: true, data: summary });
    }

    const all = db.getAttendanceRecords(orgId);
    const total = all.length;
    const present = all.filter((r) => r.status === 'PRESENT').length;
    const late = all.filter((r) => r.status === 'LATE').length;
    const absent = all.filter((r) => r.status === 'ABSENT').length;
    const excused = all.filter((r) => r.status === 'EXCUSED').length;

    const rate = total > 0 ? Math.round(((present + late * 0.8 + excused) / total) * 100) : 100;

    res.json({
      success: true,
      data: {
        totalDays: total,
        presentDays: present,
        lateDays: late,
        absentDays: absent,
        excusedDays: excused,
        attendanceRate: rate,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
