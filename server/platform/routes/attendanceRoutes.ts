import express from 'express';
import { db } from '../db';
import { PlatformRequest, requireAuth, requireRoles } from '../auth';

export const attendanceRouter = express.Router();

attendanceRouter.use(requireAuth);

// GET /api/v1/attendance
attendanceRouter.get('/', (req: PlatformRequest, res: express.Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;
    const classroomId = req.query.classroomId as string | undefined;
    const date = (req.query.date as string | undefined) || new Date().toISOString().split('T')[0];

    let records = db.getAttendance(req.organization!.id, courseId, classroomId, date);

    if (req.user!.role === 'STUDENT') {
      records = records.filter((r) => r.studentId === req.user!.id);
    }

    res.json({ success: true, data: records, date });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/attendance (Batch save roll-call)
attendanceRouter.post('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { records, courseId, classroomId, date } = req.body;
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

    // Validate that all students belong to this tenant
    for (const r of records) {
      const std = db.getUserById(r.studentId, orgId);
      if (!std || std.role !== 'STUDENT') {
        return res.status(400).json({ success: false, error: 'INVALID_STUDENT', message: `الطالب (${r.studentId}) غير صالح في المؤسسة` });
      }
    }

    const prepared = records.map((r: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; notes?: string }) => ({
      organizationId: orgId,
      courseId: courseId || undefined,
      classroomId: classroomId || 'default',
      studentId: r.studentId,
      recordedBy: req.user!.id,
      date: effectiveDate,
      status: r.status || 'PRESENT',
      notes: r.notes ? String(r.notes).trim() : '',
    }));

    const saved = db.recordAttendanceBatch(orgId, prepared);

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

// GET /api/v1/attendance/summary (Role-aware attendance percentage)
attendanceRouter.get('/summary', (req: PlatformRequest, res: express.Response) => {
  try {
    const studentId = req.user!.role === 'STUDENT' ? req.user!.id : (req.query.studentId as string | undefined);
    const all = db.getAttendance(req.organization!.id);
    const relevant = studentId ? all.filter((r) => r.studentId === studentId) : all;

    const total = relevant.length;
    const present = relevant.filter((r) => r.status === 'PRESENT').length;
    const late = relevant.filter((r) => r.status === 'LATE').length;
    const absent = relevant.filter((r) => r.status === 'ABSENT').length;
    const excused = relevant.filter((r) => r.status === 'EXCUSED').length;

    const rate = total > 0 ? Math.round(((present + late * 0.8) / total) * 100) : 100;

    res.json({
      success: true,
      data: {
        totalDays: total,
        present,
        late,
        absent,
        excused,
        attendanceRate: rate,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
