import express from 'express';
import { db } from '../db';
import { generateToken, PlatformRequest, requireAuth, requireRoles } from '../auth';
import {
  createRateLimiter,
  hashPassword,
  verifyPassword,
  generateInviteCode,
  isValidEmail,
  sanitizeString,
} from '../security';
import { UserRole } from '../types';

export const authRouter = express.Router();

// Rate limiters for security
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها، يرجى المحاولة بعد قليل.',
});

const inviteLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 50,
  message: 'تم تجاوز الحد الأقصى لإرسال الدعوات، يرجى المحاولة لاحقاً.',
});

const acceptInviteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'تم تجاوز عدد محاولات قبول الدعوة، يرجى المحاولة بعد قليل.',
});

// 1. POST /api/v1/auth/login
authRouter.post('/login', loginLimiter, (req: PlatformRequest, res: express.Response) => {
  try {
    const { email, password, tenantSlug } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'EMAIL_REQUIRED', message: 'البريد الإلكتروني مطلوب' });
    }

    const normalizedEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'صيغة البريد الإلكتروني غير صحيحة' });
    }

    let orgId: string | undefined = undefined;
    if (tenantSlug) {
      const org = db.getOrganizationBySlug(sanitizeString(tenantSlug));
      if (org) orgId = org.id;
    }

    const user = db.findUserByEmail(normalizedEmail, orgId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'بيانات تسجيل الدخول غير صحيحة أو الحساب غير مفعّل',
      });
    }

    // If password provided and user has a passwordHash, verify it
    if (password && user.passwordHash) {
      const isCorrect = verifyPassword(password, user.passwordHash);
      if (!isCorrect) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'كلمة المرور غير صحيحة',
        });
      }
    }

    const org = db.getOrganizationById(user.organizationId);
    const token = generateToken(user);

    db.logAction(user.organizationId, user.id, user.email, 'LOGIN', 'User', user.id, {}, req.ip);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        classroomId: user.classroomId,
        studentIdNumber: user.studentIdNumber,
        teacherSpecialization: user.teacherSpecialization,
      },
      organization: org,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// 2. POST /api/v1/auth/demo-switch (Persona switcher for instant testing & evaluation)
authRouter.post('/demo-switch', (req: PlatformRequest, res: express.Response) => {
  try {
    const { persona, tenantSlug } = req.body; // 'admin' | 'teacher' | 'student' | 'student2'
    const targetSlug = tenantSlug || 'horizon';
    const org = db.getOrganizationBySlug(targetSlug);

    if (!org) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND', message: 'المؤسسة غير موجودة' });
    }

    let email = 'admin@horizon.edu.sa';
    if (targetSlug === 'horizon') {
      if (persona === 'teacher') email = 'teacher@horizon.edu.sa';
      else if (persona === 'teacher2') email = 'teacher2@horizon.edu.sa';
      else if (persona === 'student') email = 'student@horizon.edu.sa';
      else if (persona === 'student2') email = 'student2@horizon.edu.sa';
      else email = 'admin@horizon.edu.sa';
    } else {
      if (persona === 'teacher') email = 'teacher.sara@elite.edu.sa';
      else if (persona === 'student') email = 'student@elite.edu.sa';
      else email = 'admin@elite.edu.sa';
    }

    const user = db.findUserByEmail(email, org.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        classroomId: user.classroomId,
        studentIdNumber: user.studentIdNumber,
        teacherSpecialization: user.teacherSpecialization,
      },
      organization: org,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// 3. GET /api/v1/auth/me
authRouter.get('/me', requireAuth, (req: PlatformRequest, res: express.Response) => {
  return res.json({
    success: true,
    user: req.user,
    organization: req.organization,
  });
});

// 4. POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, (req: PlatformRequest, res: express.Response) => {
  if (req.user && req.organization) {
    db.logAction(req.organization.id, req.user.id, req.user.email, 'LOGOUT', 'User', req.user.id, {}, req.ip);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// 5. POST /api/v1/auth/register-school (Full School Onboarding Wizard flow)
authRouter.post('/register-school', (req: PlatformRequest, res: express.Response) => {
  try {
    const { schoolName, slug, legalName, adminName, adminEmail, password, countryCode } = req.body;
    if (!schoolName || !slug || !adminName || !adminEmail) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'جميع الحقول الأساسية مطلوبة' });
    }

    const cleanSlug = sanitizeString(slug).toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanSlug || cleanSlug.length < 2) {
      return res.status(400).json({ success: false, error: 'INVALID_SLUG', message: 'معرف المدرسة يجب أن يتكون من حرفين على الأقل' });
    }

    const cleanAdminEmail = sanitizeString(adminEmail).toLowerCase();
    if (!isValidEmail(cleanAdminEmail)) {
      return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'صيغة البريد الإلكتروني للمدير غير صحيحة' });
    }

    // Check slug uniqueness
    const existing = db.getOrganizationBySlug(cleanSlug);
    if (existing) {
      return res.status(400).json({ success: false, error: 'SLUG_TAKEN', message: 'اسم المعرف للمدرسة مستخدم بالفعل' });
    }

    const org = db.createOrganization({
      name: sanitizeString(schoolName),
      slug: cleanSlug,
      legalName: legalName ? sanitizeString(legalName) : undefined,
      countryCode: countryCode || 'SA',
      timezone: 'Asia/Riyadh',
      locale: 'ar',
      isActive: true,
    });

    const passwordHash = password ? hashPassword(password) : hashPassword('RtiqaAdmin2026!');

    const admin = db.createUser({
      organizationId: org.id,
      fullName: sanitizeString(adminName),
      email: cleanAdminEmail,
      passwordHash,
      role: 'ORG_ADMIN',
      isActive: true,
    });

    // Initialize Default Academic Year & Grade Level
    const year = db.createAcademicYear({
      organizationId: org.id,
      name: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2027-06-30',
      isCurrent: true,
    });

    const term = db.createTerm({
      organizationId: org.id,
      academicYearId: year.id,
      name: 'الفصل الدراسي الأول',
      startDate: '2026-09-01',
      endDate: '2027-01-15',
      isCurrent: true,
    });

    const grade = db.createGradeLevel({
      organizationId: org.id,
      name: 'الصف العاشر',
      sequenceOrder: 10,
    });

    const classroom = db.createClassroom({
      organizationId: org.id,
      gradeLevelId: grade.id,
      name: 'شعبة 10-أ',
      capacity: 30,
    });

    const subject = db.createSubject({
      organizationId: org.id,
      name: 'الرياضيات العامة',
      code: 'MATH-10',
      color: '#10b981',
      description: 'منهج الرياضيات للمرحلة الثانوية',
    });

    db.logAction(org.id, admin.id, admin.email, 'REGISTER_SCHOOL', 'Organization', org.id, {
      schoolName,
      slug: cleanSlug,
    }, req.ip);

    const token = generateToken(admin);

    return res.json({
      success: true,
      token,
      user: admin,
      organization: org,
      initialAcademicSetup: {
        academicYearId: year.id,
        termId: term.id,
        gradeLevelId: grade.id,
        classroomId: classroom.id,
        subjectId: subject.id,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ==========================================
// User Invitations System (Secure Flow)
// ==========================================

// 6. POST /api/v1/auth/invitations (Admin creates invitation for Teacher/Student)
authRouter.post(
  '/invitations',
  requireAuth,
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  inviteLimiter,
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { email, role, fullName, classroomId, teacherSpecialization, studentIdNumber, expiresInDays = 7 } = req.body;

      if (!email || !role) {
        return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'البريد الإلكتروني والدور مطلوبين' });
      }

      const normalizedEmail = sanitizeString(email).toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'صيغة البريد الإلكتروني غير صالحة' });
      }

      const validRoles: UserRole[] = ['ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
      if (!validRoles.includes(role as UserRole)) {
        return res.status(400).json({ success: false, error: 'INVALID_ROLE', message: 'الدور المحدد غير صالح' });
      }

      // Check if user already exists in this organization
      const existingUser = db.findUserByEmail(normalizedEmail, req.organization!.id);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'USER_EXISTS',
          message: 'المستخدم مسجل بالفعل في هذه المدرسة',
        });
      }

      // Validate classroom if specified
      if (classroomId && !db.isClassroomInOrg(classroomId, req.organization!.id)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_CLASSROOM',
          message: 'الشعبة المحددة غير موجودة في المؤسسة',
        });
      }

      const inviteCode = generateInviteCode();
      const expiresAt = new Date(Date.now() + Math.max(1, Number(expiresInDays)) * 24 * 60 * 60 * 1000).toISOString();

      const invitation = db.createInvitation({
        organizationId: req.organization!.id,
        email: normalizedEmail,
        role: role as UserRole,
        inviteCode,
        fullName: fullName ? sanitizeString(fullName) : undefined,
        classroomId,
        teacherSpecialization: teacherSpecialization ? sanitizeString(teacherSpecialization) : undefined,
        studentIdNumber: studentIdNumber ? sanitizeString(studentIdNumber) : undefined,
        createdBy: req.user!.id,
        expiresAt,
      });

      db.logAction(
        req.organization!.id,
        req.user!.id,
        req.user!.email,
        'CREATE_INVITATION',
        'Invitation',
        invitation.id,
        { email: normalizedEmail, role, inviteCode },
        req.ip
      );

      return res.json({
        success: true,
        data: {
          ...invitation,
          inviteLink: `/platform/invite/${inviteCode}`,
        },
      });
    } catch {
      return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 7. GET /api/v1/auth/invitations (List all school invitations)
authRouter.get(
  '/invitations',
  requireAuth,
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const invitations = db.getInvitationsByOrg(req.organization!.id);
      return res.json({
        success: true,
        data: invitations,
      });
    } catch {
      return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 8. DELETE /api/v1/auth/invitations/:id (Revoke invitation)
authRouter.delete(
  '/invitations/:id',
  requireAuth,
  requireRoles(['ORG_ADMIN', 'SUPER_ADMIN']),
  (req: PlatformRequest, res: express.Response) => {
    try {
      const { id } = req.params;
      const revoked = db.revokeInvitation(id, req.organization!.id);
      if (!revoked) {
        return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'الدعوة غير موجودة' });
      }

      db.logAction(req.organization!.id, req.user!.id, req.user!.email, 'REVOKE_INVITATION', 'Invitation', id, {}, req.ip);
      return res.json({ success: true, message: 'Invitation revoked successfully' });
    } catch {
      return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
  }
);

// 9. GET /api/v1/auth/invitations/verify (Public lookup by code)
authRouter.get('/invitations/verify', (req: express.Request, res: express.Response) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).json({ success: false, error: 'CODE_REQUIRED', message: 'رمز الدعوة مطلوب' });
    }

    const invitation = db.getInvitationByCode(code);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'INVALID_CODE', message: 'رمز الدعوة غير صحيح أو غير موجود' });
    }

    if (invitation.isUsed) {
      return res.status(400).json({ success: false, error: 'ALREADY_USED', message: 'تم استخدام رمز الدعوة هذا مسبقاً' });
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: 'EXPIRED', message: 'انتهت صلاحية رمز الدعوة' });
    }

    const org = db.getOrganizationById(invitation.organizationId);

    return res.json({
      success: true,
      data: {
        code: invitation.inviteCode,
        email: invitation.email,
        fullName: invitation.fullName,
        role: invitation.role,
        classroomName: invitation.classroomName,
        teacherSpecialization: invitation.teacherSpecialization,
        organization: {
          id: org?.id,
          name: org?.name,
          slug: org?.slug,
          logoUrl: org?.logoUrl,
        },
        expiresAt: invitation.expiresAt,
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// 10. POST /api/v1/auth/invitations/accept (Accept invitation and create account)
authRouter.post('/invitations/accept', acceptInviteLimiter, (req: express.Request, res: express.Response) => {
  try {
    const { code, fullName, password } = req.body;
    if (!code || !password) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'رمز الدعوة وكلمة المرور مطلوبان' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'WEAK_PASSWORD', message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' });
    }

    const invitation = db.getInvitationByCode(code);
    if (!invitation) {
      return res.status(404).json({ success: false, error: 'INVALID_CODE', message: 'رمز الدعوة غير صحيح' });
    }

    if (invitation.isUsed) {
      return res.status(400).json({ success: false, error: 'ALREADY_USED', message: 'تم استخدام رمز الدعوة هذا مسبقاً' });
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, error: 'EXPIRED', message: 'انتهت صلاحية رمز الدعوة' });
    }

    // Check if user account was created by someone else in the meantime
    const existing = db.findUserByEmail(invitation.email, invitation.organizationId);
    if (existing) {
      return res.status(400).json({ success: false, error: 'USER_EXISTS', message: 'الحساب مفعل مسبقاً' });
    }

    const passwordHash = hashPassword(password);
    const resolvedName = fullName ? sanitizeString(fullName) : invitation.fullName || invitation.email.split('@')[0];

    const newUser = db.createUser({
      organizationId: invitation.organizationId,
      email: invitation.email,
      fullName: resolvedName,
      passwordHash,
      role: invitation.role,
      classroomId: invitation.classroomId,
      teacherSpecialization: invitation.teacherSpecialization,
      studentIdNumber: invitation.studentIdNumber || (invitation.role === 'STUDENT' ? `STD-${Date.now().toString().slice(-5)}` : undefined),
      isActive: true,
    });

    db.markInvitationUsed(invitation.id, invitation.organizationId);

    const org = db.getOrganizationById(invitation.organizationId);
    const token = generateToken(newUser);

    db.logAction(
      invitation.organizationId,
      newUser.id,
      newUser.email,
      'ACCEPT_INVITATION',
      'User',
      newUser.id,
      { inviteCode: invitation.inviteCode, role: newUser.role },
      (req as unknown as { ip?: string }).ip
    );

    return res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        classroomId: newUser.classroomId,
        studentIdNumber: newUser.studentIdNumber,
        teacherSpecialization: newUser.teacherSpecialization,
      },
      organization: org,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
