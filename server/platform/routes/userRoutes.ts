import express from 'express';
import { db } from '../db';
import { PlatformRequest, requireAuth, requireRoles } from '../auth';
import { UserRole } from '../types';
import { isValidEmail, sanitizeString } from '../security';

export const userRouter = express.Router();

userRouter.use(requireAuth);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/v1/users (Filter by role, classroom, search)
userRouter.get('/', (req: PlatformRequest, res: express.Response) => {
  try {
    const role = req.query.role as UserRole | undefined;
    const classroomId = req.query.classroomId as string | undefined;
    const search = (req.query.search as string | undefined)?.toLowerCase().trim();

    let users = db.getUsersByOrg(req.organization!.id, role);

    if (classroomId) {
      users = users.filter((u) => u.classroomId === classroomId);
    }

    if (search) {
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          (u.studentIdNumber && u.studentIdNumber.toLowerCase().includes(search))
      );
    }

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        avatarUrl: u.avatarUrl,
        phone: u.phone,
        studentIdNumber: u.studentIdNumber,
        teacherSpecialization: u.teacherSpecialization,
        classroomId: u.classroomId,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/users (Create teacher / student / admin)
userRouter.post('/', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { email, fullName, role, phone, studentIdNumber, teacherSpecialization, classroomId } = req.body;

    if (!email || !fullName || !role) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'الاسم والبريد والدور مطلوبين' });
    }

    const normalizedEmail = sanitizeString(email).toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'صيغة البريد الإلكتروني غير صحيحة' });
    }

    const validRoles: UserRole[] = ['ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
    if (!validRoles.includes(role as UserRole)) {
      return res.status(400).json({ success: false, error: 'INVALID_ROLE', message: 'الدور المحدد غير صالح' });
    }

    // Verify classroom if provided
    if (classroomId && !db.isClassroomInOrg(classroomId, req.organization!.id)) {
      return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية غير موجودة في المؤسسة' });
    }

    const existing = db.findUserByEmail(normalizedEmail, req.organization!.id);
    if (existing) {
      return res.status(400).json({ success: false, error: 'EMAIL_EXISTS', message: 'البريد الإلكتروني مسجل مسبقاً في هذه المؤسسة' });
    }

    const user = db.createUser({
      organizationId: req.organization!.id,
      email: normalizedEmail,
      fullName: sanitizeString(fullName),
      role: role as UserRole,
      phone: phone ? sanitizeString(phone) : undefined,
      studentIdNumber: studentIdNumber ? sanitizeString(studentIdNumber) : undefined,
      teacherSpecialization: teacherSpecialization ? sanitizeString(teacherSpecialization) : undefined,
      classroomId,
      isActive: true,
    });

    db.logAction(
      req.organization!.id,
      req.user!.id,
      req.user!.email,
      'CREATE_USER',
      'User',
      user.id,
      { role, email: normalizedEmail },
      req.ip
    );

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// Helper for parsing CSV lines safely
function parseCsvRows(csvContent: string) {
  const lines = csvContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length < 2) return { header: [], rows: [] };

  const header = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const rows = lines.slice(1);
  return { header, rows };
}

// POST /api/v1/users/import-csv/preview (Dry-run parser for CSV data)
userRouter.post(
  '/import-csv/preview',
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { csvContent, targetRole = 'STUDENT', targetClassroomId } = req.body;
      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ success: false, error: 'NO_CSV_DATA', message: 'يرجى إرسال بيانات ملف CSV' });
      }

      const { header, rows } = parseCsvRows(csvContent);
      if (rows.length === 0) {
        return res.status(400).json({ success: false, error: 'EMPTY_CSV', message: 'الملف فارغ أو لا يحتوي على صفوف بيانات' });
      }

      const previewRows: Array<{
        row: number;
        fullName: string;
        email: string;
        identifier?: string;
        phone?: string;
        isValid: boolean;
        errorMessage?: string;
      }> = [];

      const seenEmailsInFile = new Set<string>();
      let validCount = 0;
      let errorCount = 0;

      rows.forEach((line, index) => {
        const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
        const name = cols[0] || '';
        const rawEmail = cols[1] || '';
        const idOrSpec = cols[2] || '';
        const phone = cols[3] || '';

        const rowNum = index + 2;
        const email = rawEmail.toLowerCase().trim();

        if (!name || !rawEmail) {
          errorCount++;
          previewRows.push({
            row: rowNum,
            fullName: name,
            email: rawEmail,
            identifier: idOrSpec,
            phone,
            isValid: false,
            errorMessage: 'الاسم والبريد الإلكتروني حقلان إلزاميان',
          });
          return;
        }

        if (!EMAIL_REGEX.test(email)) {
          errorCount++;
          previewRows.push({
            row: rowNum,
            fullName: name,
            email,
            identifier: idOrSpec,
            phone,
            isValid: false,
            errorMessage: 'صيغة البريد الإلكتروني غير صالحة',
          });
          return;
        }

        if (seenEmailsInFile.has(email)) {
          errorCount++;
          previewRows.push({
            row: rowNum,
            fullName: name,
            email,
            identifier: idOrSpec,
            phone,
            isValid: false,
            errorMessage: 'البريد الإلكتروني مكرر في الملف',
          });
          return;
        }
        seenEmailsInFile.add(email);

        if (db.findUserByEmail(email, req.organization!.id)) {
          errorCount++;
          previewRows.push({
            row: rowNum,
            fullName: name,
            email,
            identifier: idOrSpec,
            phone,
            isValid: false,
            errorMessage: 'البريد مسجل بالفعل في هذه المدرسة',
          });
          return;
        }

        validCount++;
        previewRows.push({
          row: rowNum,
          fullName: name,
          email,
          identifier: idOrSpec,
          phone,
          isValid: true,
        });
      });

      return res.json({
        success: true,
        summary: {
          totalRows: rows.length,
          validCount,
          errorCount,
          targetRole,
          targetClassroomId,
        },
        preview: previewRows,
      });
    } catch {
      return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// POST /api/v1/users/import-csv (Bulk Import Students / Teachers)
userRouter.post('/import-csv', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { csvContent, targetClassroomId, targetRole = 'STUDENT' } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ success: false, error: 'NO_CSV_DATA', message: 'يرجى إرسال بيانات ملف CSV' });
    }

    if (targetClassroomId && !db.isClassroomInOrg(targetClassroomId, req.organization!.id)) {
      return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة المحددة غير موجودة في المؤسسة' });
    }

    const { rows } = parseCsvRows(csvContent);
    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'EMPTY_CSV', message: 'الملف فارغ أو لا يحتوي على صفوف بيانات' });
    }

    const imported: unknown[] = [];
    const errors: { row: number; reason: string }[] = [];
    const seenEmailsInFile = new Set<string>();

    rows.forEach((line, index) => {
      const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length < 2) {
        errors.push({ row: index + 2, reason: 'تنسيق الصف غير صالح' });
        return;
      }

      const [name, rawEmail, customIdentifier, phone] = cols;
      if (!name || !rawEmail) {
        errors.push({ row: index + 2, reason: 'الاسم أو البريد مفقود' });
        return;
      }

      const email = rawEmail.toLowerCase().trim();
      if (!EMAIL_REGEX.test(email)) {
        errors.push({ row: index + 2, reason: `صيغة البريد الإلكتروني (${email}) غير صالحة` });
        return;
      }

      if (seenEmailsInFile.has(email)) {
        errors.push({ row: index + 2, reason: `البريد (${email}) مكرر في الملف نفسه` });
        return;
      }
      seenEmailsInFile.add(email);

      if (db.findUserByEmail(email, req.organization!.id)) {
        errors.push({ row: index + 2, reason: `البريد (${email}) موجود مسبقاً في قاعدة البيانات` });
        return;
      }

      const role: UserRole = targetRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';

      const user = db.createUser({
        organizationId: req.organization!.id,
        email,
        fullName: name.trim(),
        role,
        studentIdNumber:
          role === 'STUDENT'
            ? (customIdentifier && customIdentifier.trim()) || `STD-${Date.now().toString().slice(-4)}${index}`
            : undefined,
        teacherSpecialization:
          role === 'TEACHER' ? (customIdentifier && customIdentifier.trim()) || 'معلم' : undefined,
        phone: (phone && phone.trim()) || '',
        classroomId: role === 'STUDENT' ? targetClassroomId : undefined,
        isActive: true,
      });
      imported.push(user);
    });

    db.logAction(
      req.organization!.id,
      req.user!.id,
      req.user!.email,
      'BULK_IMPORT_USERS',
      'User',
      `${imported.length}_imported`,
      { count: imported.length, errorsCount: errors.length, role: targetRole },
      req.ip
    );

    res.json({
      success: true,
      summary: {
        totalRows: rows.length,
        importedCount: imported.length,
        failedCount: errors.length,
        errors,
      },
      data: imported,
    });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// PUT /api/v1/users/:id
userRouter.put('/:id', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    const { email, fullName, role, phone, studentIdNumber, teacherSpecialization, classroomId, isActive } = req.body;

    const existingUser = db.getUserById(id, req.organization!.id);
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'المستخدم غير موجود في هذه المؤسسة' });
    }

    if (id === req.user!.id && isActive === false) {
      return res.status(400).json({ success: false, error: 'CANNOT_DEACTIVATE_SELF', message: 'لا يمكنك تعطيل حسابك الخاص' });
    }

    if (classroomId && !db.isClassroomInOrg(classroomId, req.organization!.id)) {
      return res.status(400).json({ success: false, error: 'INVALID_CLASSROOM', message: 'الشعبة الدراسية غير صالحة' });
    }

    const updates: Partial<typeof existingUser> = {};
    if (fullName) updates.fullName = sanitizeString(fullName);
    if (phone !== undefined) updates.phone = sanitizeString(phone);
    if (studentIdNumber !== undefined) updates.studentIdNumber = sanitizeString(studentIdNumber);
    if (teacherSpecialization !== undefined) updates.teacherSpecialization = sanitizeString(teacherSpecialization);
    if (classroomId !== undefined) updates.classroomId = classroomId;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (role && ['ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'].includes(role)) {
      updates.role = role as UserRole;
    }

    const updated = db.updateUser(id, req.organization!.id, updates);
    db.logAction(req.organization!.id, req.user!.id, req.user!.email, 'UPDATE_USER', 'User', id, { updates }, req.ip);

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// DELETE /api/v1/users/:id
userRouter.delete('/:id', requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']), (req: PlatformRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'CANNOT_DELETE_SELF', message: 'لا يمكنك حذف حسابك الخاص' });
    }

    const deleted = db.deleteUser(id, req.organization!.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'المستخدم غير موجود في هذه المؤسسة' });
    }

    db.logAction(req.organization!.id, req.user!.id, req.user!.email, 'DELETE_USER', 'User', id, {}, req.ip);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch {
    res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
