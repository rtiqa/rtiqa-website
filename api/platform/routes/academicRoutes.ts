import express from 'express';
import { db } from '../db';
import { PlatformRequest, requireAuth, requireRoles } from '../auth';

export const academicRouter = express.Router();

academicRouter.use(requireAuth);

// Academic Years
academicRouter.get('/years', (req: PlatformRequest, res: express.Response) => {
  try {
    const years = db.getAcademicYears(req.organization!.id);
    res.json({ success: true, data: years });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

academicRouter.post('/years', requireRoles(['ORG_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'اسم السنة الأكاديمية وتواريخ البداية والنهاية مطلوبة' });
    }
    const year = db.createAcademicYear({
      organizationId: req.organization!.id,
      name: String(name).trim(),
      startDate,
      endDate,
      isCurrent: Boolean(isCurrent),
    });
    res.json({ success: true, data: year });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// Terms
academicRouter.get('/terms', (req: PlatformRequest, res: express.Response) => {
  try {
    const yearId = req.query.yearId as string | undefined;
    const terms = db.getTerms(req.organization!.id, yearId);
    res.json({ success: true, data: terms });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

academicRouter.post('/terms', requireRoles(['ORG_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { academicYearId, name, startDate, endDate, isCurrent } = req.body;
    if (!academicYearId || !name || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'جميع بيانات الفصل الدراسي مطلوبة' });
    }

    // Verify academic year belongs to tenant
    if (!db.isAcademicYearInOrg(academicYearId, req.organization!.id)) {
      return res.status(400).json({ success: false, error: 'INVALID_YEAR', message: 'السنة الأكاديمية غير موجودة في المؤسسة' });
    }

    const term = db.createTerm({
      organizationId: req.organization!.id,
      academicYearId,
      name: String(name).trim(),
      startDate,
      endDate,
      isCurrent: Boolean(isCurrent),
    });
    res.json({ success: true, data: term });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// Grade Levels
academicRouter.get('/grades', (req: PlatformRequest, res: express.Response) => {
  try {
    const grades = db.getGradeLevels(req.organization!.id);
    res.json({ success: true, data: grades });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

academicRouter.post('/grades', requireRoles(['ORG_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { name, sequenceOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'NAME_REQUIRED', message: 'اسم المرحلة/الصف مطلوب' });
    const grade = db.createGradeLevel({
      organizationId: req.organization!.id,
      name: String(name).trim(),
      sequenceOrder: Number(sequenceOrder) || 1,
    });
    res.json({ success: true, data: grade });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// Classrooms
academicRouter.get('/classrooms', (req: PlatformRequest, res: express.Response) => {
  try {
    const gradeLevelId = req.query.gradeLevelId as string | undefined;
    const classrooms = db.getClassrooms(req.organization!.id, gradeLevelId);
    res.json({ success: true, data: classrooms });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

academicRouter.post('/classrooms', requireRoles(['ORG_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { gradeLevelId, name, capacity } = req.body;
    if (!gradeLevelId || !name) return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'الصف والمرحلة مطلوبة' });

    // Verify grade level belongs to tenant
    if (!db.isGradeLevelInOrg(gradeLevelId, req.organization!.id)) {
      return res.status(400).json({ success: false, error: 'INVALID_GRADE_LEVEL', message: 'المرحلة الدراسية غير صالحة' });
    }

    const classroom = db.createClassroom({
      organizationId: req.organization!.id,
      gradeLevelId,
      name: String(name).trim(),
      capacity: capacity ? Number(capacity) : undefined,
    });
    res.json({ success: true, data: classroom });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// Subjects
academicRouter.get('/subjects', (req: PlatformRequest, res: express.Response) => {
  try {
    const subjects = db.getSubjects(req.organization!.id);
    res.json({ success: true, data: subjects });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

academicRouter.post('/subjects', requireRoles(['ORG_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { name, code, color, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, error: 'NAME_AND_CODE_REQUIRED', message: 'اسم المادة والرمز التعريفي مطلوبين' });
    const subject = db.createSubject({
      organizationId: req.organization!.id,
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      color: color || '#10b981',
      description: description ? String(description).trim() : undefined,
    });
    res.json({ success: true, data: subject });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
