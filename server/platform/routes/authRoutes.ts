import express from 'express';
import { db } from '../db.ts';
import type { PlatformRequest } from '../auth.ts';
import { generateToken, requireAuth, requireRoles } from '../auth.ts';
import {
  createRateLimiter,
  hashPassword,
  verifyPassword,
  generateInviteCode,
  generateOtp,
  hashOtp,
  verifyOtp,
  generateSecureToken,
  validatePasswordStrength,
  isValidEmail,
  sanitizeString,
} from '../security.ts';
import { getActiveSmsProvider, normalizePhoneNumber } from '../smsService.ts';
import {
  buildGoogleAuthUrl,
  exchangeGoogleCodeForProfile,
  verifyGoogleIdToken,
  generateOAuthState,
  parseOAuthState,
  getGoogleOAuthCredentials,
} from '../googleAuth.ts';
import type { UserRole, AuthProviderType, User } from '../types.ts';

export const authRouter = express.Router();

// Rate limiters for security
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'تم تجاوز عدد محاولات تسجيل الدخول المسموح بها، يرجى المحاولة بعد قليل.',
});

const otpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  message: 'تم تجاوز الحد المسموح لطلب رموز التحقق، يرجى الانتظار 10 دقائق.',
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  message: 'تم تجاوز عدد عمليات التسجيل المسموح بها من هذا العنوان، يرجى المحاولة لاحقاً.',
});

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
  message: 'تم تجاوز الحد الأقصى لطلب استعادة كلمة المرور، يرجى المحاولة لاحقاً.',
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

// Helper to sanitize safe user object for response
function formatUserResponse(user: User) {
  const memberships = db.getMembershipsByUserId(user.id);
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified ?? false,
    phoneVerified: user.phoneVerified ?? false,
    authProviders: user.authProviders || ['email'],
    classroomId: user.classroomId,
    studentIdNumber: user.studentIdNumber,
    teacherSpecialization: user.teacherSpecialization,
    memberships,
    createdAt: user.createdAt,
  };
}

// ====================================================================
// 1. STANDARD CREDENTIALS AUTH (EMAIL / PHONE & PASSWORD)
// ====================================================================

// POST /api/v1/auth/login (Support Login via Email OR Phone)
authRouter.post('/login', loginLimiter, (req: PlatformRequest, res: express.Response) => {
  try {
    const { email, identifier, phone, password, tenantSlug } = req.body;
    const loginIdentifier = sanitizeString(identifier || email || phone);

    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_REQUIRED',
        message: 'البريد الإلكتروني أو رقم الهاتف مطلوب لتسجيل الدخول',
      });
    }

    let orgId: string | undefined = undefined;
    if (tenantSlug) {
      const org = db.getOrganizationBySlug(sanitizeString(tenantSlug));
      if (org) orgId = org.id;
    }

    let user: User | undefined = undefined;

    // Check if identifier is email or phone
    if (isValidEmail(loginIdentifier)) {
      user = db.findUserByEmail(loginIdentifier.toLowerCase(), orgId);
    } else {
      const phoneNorm = normalizePhoneNumber(loginIdentifier);
      if (phoneNorm.isValid) {
        user = db.findUserByPhone(phoneNorm.e164, orgId);
      } else {
        // Fallback search by email
        user = db.findUserByEmail(loginIdentifier.toLowerCase(), orgId);
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'بيانات تسجيل الدخول غير صحيحة أو الحساب غير مفعّل',
      });
    }

    // Verify Password if provided and user has a passwordHash
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
      user: formatUserResponse(user),
      organization: org,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/register (Standard User Registration)
authRouter.post('/register', registerLimiter, (req: PlatformRequest, res: express.Response) => {
  try {
    const { fullName, email, phone, password, role = 'STUDENT', tenantSlug } = req.body;

    if (!fullName || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'الاسم الكامل والبريد الإلكتروني أو رقم الهاتف مطلوبان للتسجيل',
      });
    }

    const cleanFullName = sanitizeString(fullName);
    if (cleanFullName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_NAME',
        message: 'يرجى إدخال اسم صحيح مكون من حرفين على الأقل',
      });
    }

    let cleanEmail = '';
    if (email) {
      cleanEmail = sanitizeString(email).toLowerCase();
      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_EMAIL',
          message: 'صيغة البريد الإلكتروني غير صحيحة',
        });
      }
    }

    let cleanPhone = '';
    if (phone) {
      const phoneNorm = normalizePhoneNumber(phone);
      if (!phoneNorm.isValid) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE',
          message: phoneNorm.error || 'صيغة رقم الهاتف غير صالحة',
        });
      }
      cleanPhone = phoneNorm.e164;
    }

    // Resolve target Organization
    const targetSlug = sanitizeString(tenantSlug) || 'horizon';
    let org = db.getOrganizationBySlug(targetSlug);
    if (!org) {
      org = db.getOrganizationBySlug('horizon') || db.getAllOrganizations()[0];
    }
    const orgId = org ? org.id : 'org_horizon_001';

    // Check duplicate email
    if (cleanEmail) {
      const existingEmail = db.findUserByEmail(cleanEmail);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'EMAIL_IN_USE',
          message: 'البريد الإلكتروني مستخدم بالفعل، يرجى تسجيل الدخول أو استعادة كلمة المرور',
        });
      }
    }

    // Check duplicate phone
    if (cleanPhone) {
      const existingPhone = db.findUserByPhone(cleanPhone);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          error: 'PHONE_IN_USE',
          message: 'رقم الهاتف مستخدم بالفعل بحساب آخر',
        });
      }
    }

    // Validate password if provided
    let passwordHash: string | undefined = undefined;
    if (password) {
      const pStrength = validatePasswordStrength(password);
      if (!pStrength.isValid) {
        return res.status(400).json({
          success: false,
          error: 'WEAK_PASSWORD',
          message: pStrength.message,
        });
      }
      passwordHash = hashPassword(password);
    }

    const providers: AuthProviderType[] = [];
    if (cleanEmail && password) providers.push('email');
    if (cleanPhone) providers.push('phone');

    const validRoles: UserRole[] = ['STUDENT', 'TEACHER', 'PARENT', 'ORG_ADMIN'];
    const chosenRole: UserRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'STUDENT';

    const newUser = db.createUser({
      organizationId: orgId,
      email: cleanEmail || `user_${Date.now()}@rtiqa.local`,
      phone: cleanPhone || undefined,
      fullName: cleanFullName,
      passwordHash,
      role: chosenRole,
      emailVerified: false,
      phoneVerified: false,
      authProviders: providers.length > 0 ? providers : ['email'],
      isActive: true,
    });

    const token = generateToken(newUser);

    // Create verification token if email provided
    let verificationSent = false;
    if (cleanEmail) {
      const rawToken = generateSecureToken(24);
      const tokenHash = hashOtp(rawToken);
      db.createEmailVerificationToken(newUser.id, cleanEmail, tokenHash);
      verificationSent = true;
    }

    db.logAction(orgId, newUser.id, newUser.email, 'REGISTER', 'User', newUser.id, { role: chosenRole }, req.ip);

    return res.status(201).json({
      success: true,
      token,
      user: formatUserResponse(newUser),
      organization: org,
      verificationSent,
      message: 'تم إنشاء الحساب بنجاح',
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ====================================================================
// 2. PHONE NUMBER & OTP AUTHENTICATION FLOW
// ====================================================================

// POST /api/v1/auth/phone/otp/send (Send 6-digit OTP to Phone)
authRouter.post('/phone/otp/send', otpLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const { phone, purpose = 'login' } = req.body;

    const phoneNorm = normalizePhoneNumber(phone);
    if (!phoneNorm.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: phoneNorm.error || 'يرجى إدخال رقم هاتف دولي صالح',
      });
    }

    // Check cooldown for active OTP
    const existingOtp = db.getLatestActivePhoneOtp(phoneNorm.e164);
    if (existingOtp) {
      const createdTime = new Date(existingOtp.createdAt).getTime();
      const secondsSince = (Date.now() - createdTime) / 1000;
      if (secondsSince < 60) {
        const remaining = Math.ceil(60 - secondsSince);
        return res.status(429).json({
          success: false,
          error: 'OTP_COOLDOWN',
          message: `يرجى الانتظار ${remaining} ثانية قبل طلب رمز جديد`,
          retryAfterSeconds: remaining,
        });
      }
    }

    const otp = generateOtp(6);
    const otpHash = hashOtp(otp);

    // Optional user matching
    const existingUser = db.findUserByPhone(phoneNorm.e164);
    db.createPhoneOtp(phoneNorm.e164, otpHash, existingUser?.id, 10);

    const smsProvider = getActiveSmsProvider();
    const smsResult = await smsProvider.sendOtp(phoneNorm.e164, otp, purpose);

    return res.json({
      success: true,
      phone: phoneNorm.e164,
      provider: smsResult.provider,
      isSimulated: smsResult.isSimulated ?? false,
      expiresInSeconds: 600,
      cooldownSeconds: 60,
      message: 'تم إرسال رمز التحقق بنجاح إلى هاتفك',
      // In non-production/test environments with simulated SMS, provide code for developer testing
      ...(process.env.NODE_ENV !== 'production' ? { devOtpCode: otp } : {}),
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/phone/otp/verify (Verify OTP & Login or Register)
authRouter.post('/phone/otp/verify', loginLimiter, (req: express.Request, res: express.Response) => {
  try {
    const { phone, code, fullName, tenantSlug } = req.body;

    const phoneNorm = normalizePhoneNumber(phone);
    if (!phoneNorm.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: phoneNorm.error || 'رقم الهاتف غير صالح',
      });
    }

    if (!code || typeof code !== 'string' || code.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: 'CODE_REQUIRED',
        message: 'رمز التحقق مطلوب',
      });
    }

    const activeOtp = db.getLatestActivePhoneOtp(phoneNorm.e164);
    if (!activeOtp) {
      return res.status(400).json({
        success: false,
        error: 'OTP_EXPIRED_OR_NOT_FOUND',
        message: 'رمز التحقق منتهي الصلاحية أو غير موجود، يرجى طلب رمز جديد',
      });
    }

    const isMatch = verifyOtp(code.trim(), activeOtp.otpHash);
    if (!isMatch) {
      const attempts = db.incrementPhoneOtpAttempts(activeOtp.id);
      const remainingAttempts = Math.max(0, activeOtp.maxAttempts - attempts);

      if (remainingAttempts === 0) {
        return res.status(400).json({
          success: false,
          error: 'OTP_MAX_ATTEMPTS_EXCEEDED',
          message: 'تم تجاوز عدد المحاولات الخاطئة. تم إلغاء الرمز، يرجى طلب رمز جديد.',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'INVALID_OTP',
        message: `رمز التحقق غير صحيح. يتبقى لديك ${remainingAttempts} محاولات.`,
        remainingAttempts,
      });
    }

    // OTP Verified! Mark used
    db.markPhoneOtpUsed(activeOtp.id);

    // Find or create user
    let user = db.findUserByPhone(phoneNorm.e164);

    if (!user) {
      // Resolve organization
      const targetSlug = sanitizeString(tenantSlug) || 'horizon';
      const org = db.getOrganizationBySlug(targetSlug) || db.getAllOrganizations()[0];
      const orgId = org ? org.id : 'org_horizon_001';

      const userName = fullName ? sanitizeString(fullName) : `مستخدم ${phoneNorm.e164.slice(-4)}`;

      user = db.createUser({
        organizationId: orgId,
        email: `phone_${phoneNorm.e164.replace(/[^0-9]/g, '')}@rtiqa.local`,
        phone: phoneNorm.e164,
        fullName: userName,
        role: 'STUDENT',
        phoneVerified: true,
        authProviders: ['phone'],
        isActive: true,
      });
    } else {
      // Update phoneVerified flag and link provider if not present
      db.linkAccountProvider(user.id, 'phone', { phone: phoneNorm.e164 });
      user = db.getUserById(user.id)!;
    }

    const org = db.getOrganizationById(user.organizationId);
    const token = generateToken(user);

    db.logAction(user.organizationId, user.id, user.email, 'LOGIN_PHONE_OTP', 'User', user.id, { phone: phoneNorm.e164 }, req.ip);

    return res.json({
      success: true,
      token,
      user: formatUserResponse(user),
      organization: org,
      message: 'تم التحقق وتسجيل الدخول بنجاح',
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ====================================================================
// 3. GOOGLE SIGN-IN & OAUTH FLOW
// ====================================================================

// GET /api/v1/auth/google/url (Get Google OAuth Authorization URL)
authRouter.get('/google/url', (req: express.Request, res: express.Response) => {
  try {
    const tenantSlug = (req.query.tenantSlug as string) || 'horizon';
    const state = generateOAuthState(tenantSlug);

    // Compute redirect URI based on request host or APP_URL
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const origin = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${origin}/api/v1/auth/google/callback`;

    const { url, clientId } = buildGoogleAuthUrl(redirectUri, state);
    const { isConfigured } = getGoogleOAuthCredentials();

    return res.json({
      success: true,
      url,
      clientId,
      state,
      isConfigured,
      redirectUri,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET & POST /api/v1/auth/google/callback (Handle Google OAuth Callback)
const handleGoogleCallback = async (req: express.Request, res: express.Response) => {
  try {
    const code = (req.query.code || req.body?.code) as string;
    const state = (req.query.state || req.body?.state) as string;
    const isPopup = req.query.popup === 'true' || req.headers.accept?.includes('text/html');

    if (!code) {
      if (isPopup) {
        return res.send(`
          <html><body><script>
            window.opener && window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: 'MISSING_CODE' }, '*');
            window.close();
          </script></body></html>
        `);
      }
      return res.status(400).json({ success: false, error: 'CODE_REQUIRED', message: 'رمز تفويض Google مطلوب' });
    }

    const stateParsed = parseOAuthState(state);
    const tenantSlug = stateParsed.tenantSlug || 'horizon';

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const origin = process.env.APP_URL || `${protocol}://${host}`;
    const redirectUri = `${origin}/api/v1/auth/google/callback`;

    const exchange = await exchangeGoogleCodeForProfile(code, redirectUri);
    if (!exchange.success || !exchange.profile) {
      if (isPopup) {
        return res.send(`
          <html><body><script>
            window.opener && window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(exchange.error)} }, '*');
            window.close();
          </script></body></html>
        `);
      }
      return res.status(400).json({ success: false, error: 'GOOGLE_AUTH_FAILED', message: exchange.error });
    }

    const { profile } = exchange;
    const emailNorm = profile.email.toLowerCase().trim();

    // 1. Look up existing user by googleId or verified email
    let user = db.findUserByGoogleId(profile.sub) || db.findUserByEmail(emailNorm);

    if (user) {
      // Link Google provider safely
      db.linkAccountProvider(user.id, 'google', {
        googleId: profile.sub,
        email: emailNorm,
      });
      if (profile.picture && !user.avatarUrl) {
        db.updateUser(user.id, undefined, { avatarUrl: profile.picture });
      }
      user = db.getUserById(user.id)!;
    } else {
      // Create new user with Google identity
      const org = db.getOrganizationBySlug(tenantSlug) || db.getAllOrganizations()[0];
      const orgId = org ? org.id : 'org_horizon_001';

      user = db.createUser({
        organizationId: orgId,
        email: emailNorm,
        fullName: profile.name || emailNorm.split('@')[0],
        avatarUrl: profile.picture,
        role: 'STUDENT',
        emailVerified: profile.email_verified,
        phoneVerified: false,
        authProviders: ['google'],
        googleId: profile.sub,
        isActive: true,
      });
    }

    const token = generateToken(user);
    const org = db.getOrganizationById(user.organizationId);

    db.logAction(user.organizationId, user.id, user.email, 'LOGIN_GOOGLE', 'User', user.id, { googleSub: profile.sub }, req.ip);

    if (isPopup) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Authentication Complete</title></head>
        <body>
          <script>
            const authPayload = {
              type: 'GOOGLE_AUTH_SUCCESS',
              token: ${JSON.stringify(token)},
              user: ${JSON.stringify(formatUserResponse(user))},
              organization: ${JSON.stringify(org)}
            };
            if (window.opener) {
              window.opener.postMessage(authPayload, '*');
              window.close();
            } else {
              window.location.href = '/platform/dashboard';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h2>تم تسجيل الدخول بنجاح</h2>
            <p>جارٍ تحويلك إلى لوحة التحكم...</p>
          </div>
        </body>
        </html>
      `);
    }

    return res.json({
      success: true,
      token,
      user: formatUserResponse(user),
      organization: org,
      message: 'تم تسجيل الدخول بواسطة Google بنجاح',
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
};

authRouter.get('/google/callback', handleGoogleCallback);
authRouter.post('/google/callback', handleGoogleCallback);

// POST /api/v1/auth/google/verify-credential (Google One Tap / Google Button Credential)
authRouter.post('/google/verify-credential', loginLimiter, async (req: express.Request, res: express.Response) => {
  try {
    const { credential, tenantSlug } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'CREDENTIAL_REQUIRED', message: 'رمز Google Credential مطلوب' });
    }

    const verify = await verifyGoogleIdToken(credential);
    if (!verify.success || !verify.profile) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_GOOGLE_CREDENTIAL',
        message: verify.error || 'فشل التحقق من هوية Google',
      });
    }

    const { profile } = verify;
    const emailNorm = profile.email.toLowerCase().trim();

    let user = db.findUserByGoogleId(profile.sub) || db.findUserByEmail(emailNorm);

    if (user) {
      db.linkAccountProvider(user.id, 'google', {
        googleId: profile.sub,
        email: emailNorm,
      });
      if (profile.picture && !user.avatarUrl) {
        db.updateUser(user.id, undefined, { avatarUrl: profile.picture });
      }
      user = db.getUserById(user.id)!;
    } else {
      const org = db.getOrganizationBySlug(sanitizeString(tenantSlug) || 'horizon') || db.getAllOrganizations()[0];
      const orgId = org ? org.id : 'org_horizon_001';

      user = db.createUser({
        organizationId: orgId,
        email: emailNorm,
        fullName: profile.name || emailNorm.split('@')[0],
        avatarUrl: profile.picture,
        role: 'STUDENT',
        emailVerified: profile.email_verified,
        authProviders: ['google'],
        googleId: profile.sub,
        isActive: true,
      });
    }

    const token = generateToken(user);
    const org = db.getOrganizationById(user.organizationId);

    db.logAction(user.organizationId, user.id, user.email, 'LOGIN_GOOGLE_CREDENTIAL', 'User', user.id, {}, req.ip);

    return res.json({
      success: true,
      token,
      user: formatUserResponse(user),
      organization: org,
      message: 'تم تسجيل الدخول بواسطة حساب Google بنجاح',
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ====================================================================
// 4. PASSWORD RESET & EMAIL VERIFICATION FLOWS
// ====================================================================

// POST /api/v1/auth/forgot-password (Safe user enumeration protected)
authRouter.post('/forgot-password', forgotPasswordLimiter, (req: express.Request, res: express.Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'EMAIL_REQUIRED', message: 'البريد الإلكتروني مطلوب' });
    }

    const cleanEmail = sanitizeString(email).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'INVALID_EMAIL', message: 'صيغة البريد الإلكتروني غير صالحة' });
    }

    const user = db.findUserByEmail(cleanEmail);
    let resetTokenValue: string | undefined = undefined;

    if (user && user.isActive) {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashOtp(rawToken);
      db.createPasswordResetToken(user.id, user.email, tokenHash, 60);
      resetTokenValue = rawToken;

      db.logAction(user.organizationId, user.id, user.email, 'REQUEST_PASSWORD_RESET', 'User', user.id, {}, req.ip);
    }

    // Always return safe friendly success message regardless of existence (Anti-Enumeration)
    return res.json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فستتلقى تعليمات استعادة كلمة المرور قريباً.',
      ...(process.env.NODE_ENV !== 'production' && resetTokenValue ? { devResetToken: resetTokenValue } : {}),
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/reset-password (Set new password with token)
authRouter.post('/reset-password', (req: express.Request, res: express.Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_FIELDS',
        message: 'رمز الاستعادة وكلمة المرور الجديدة مطلوبان',
      });
    }

    const pStrength = validatePasswordStrength(newPassword);
    if (!pStrength.isValid) {
      return res.status(400).json({
        success: false,
        error: 'WEAK_PASSWORD',
        message: pStrength.message,
      });
    }

    // Find active token by matching hash
    const resetRecord = Array.from(
      (db as unknown as { passwordResetTokens: Map<string, unknown> })['passwordResetTokens']?.values() || []
    ).find((r: unknown) => {
      const rec = r as { tokenHash: string; isUsed: boolean; expiresAt: string };
      return !rec.isUsed && new Date(rec.expiresAt).getTime() > Date.now() && verifyOtp(token, rec.tokenHash);
    }) as { id: string; userId: string } | undefined;

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'رابط استعادة كلمة المرور غير صالح أو منتهي الصلاحية',
      });
    }

    const user = db.getUserById(resetRecord.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND' });
    }

    const newHash = hashPassword(newPassword);
    db.updateUser(user.id, undefined, { passwordHash: newHash });
    db.markPasswordResetTokenUsed(resetRecord.id);

    db.logAction(user.organizationId, user.id, user.email, 'RESET_PASSWORD', 'User', user.id, {}, req.ip);

    return res.json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/change-password (Authenticated User)
authRouter.post('/change-password', requireAuth, (req: PlatformRequest, res: express.Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;

    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'NEW_PASSWORD_REQUIRED', message: 'كلمة المرور الجديدة مطلوبة' });
    }

    // If user has existing password, verify currentPassword
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'CURRENT_PASSWORD_REQUIRED', message: 'كلمة المرور الحالية مطلوبة' });
      }
      if (!verifyPassword(currentPassword, user.passwordHash)) {
        return res.status(400).json({ success: false, error: 'INCORRECT_PASSWORD', message: 'كلمة المرور الحالية غير صحيحة' });
      }
    }

    const pStrength = validatePasswordStrength(newPassword);
    if (!pStrength.isValid) {
      return res.status(400).json({ success: false, error: 'WEAK_PASSWORD', message: pStrength.message });
    }

    const newHash = hashPassword(newPassword);
    const updated = db.updateUser(user.id, undefined, { passwordHash: newHash });

    db.logAction(user.organizationId, user.id, user.email, 'CHANGE_PASSWORD', 'User', user.id, {}, req.ip);

    return res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
      user: updated ? formatUserResponse(updated) : undefined,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/verify-email/send (Send verification email)
authRouter.post('/verify-email/send', requireAuth, (req: PlatformRequest, res: express.Response) => {
  try {
    const user = req.user!;
    const force = req.body && req.body.force === true;
    if (user.emailVerified && !force && process.env.NODE_ENV === 'production') {
      return res.json({ success: true, message: 'البريد الإلكتروني موثق بالفعل', alreadyVerified: true });
    }

    const rawToken = generateSecureToken(24);
    const tokenHash = hashOtp(rawToken);
    db.createEmailVerificationToken(user.id, user.email, tokenHash);

    db.logAction(user.organizationId, user.id, user.email, 'SEND_EMAIL_VERIFICATION', 'User', user.id, {}, req.ip);

    return res.json({
      success: true,
      message: 'تم إرسال رابط تأكيد البريد الإلكتروني بنجاح',
      ...(process.env.NODE_ENV !== 'production' ? { devVerificationToken: rawToken } : {}),
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/verify-email/confirm (Confirm email token)
authRouter.post('/verify-email/confirm', (req: express.Request, res: express.Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'TOKEN_REQUIRED', message: 'رمز التأكيد مطلوب' });
    }

    const match = Array.from(
      (db as unknown as { emailVerificationTokens: Map<string, unknown> })['emailVerificationTokens']?.values() || []
    ).find((r: unknown) => {
      const rec = r as { tokenHash: string; isUsed: boolean; expiresAt: string };
      return !rec.isUsed && new Date(rec.expiresAt).getTime() > Date.now() && verifyOtp(token, rec.tokenHash);
    }) as { id: string; userId: string; email: string } | undefined;

    if (!match) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'رمز التحقق غير صالح أو منتهي الصلاحية',
      });
    }

    const updated = db.updateUser(match.userId, undefined, { emailVerified: true });
    db.markEmailVerificationTokenUsed(match.id);

    return res.json({
      success: true,
      message: 'تم توثيق البريد الإلكتروني بنجاح',
      user: updated ? formatUserResponse(updated) : undefined,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ====================================================================
// 5. ACCOUNT LINKING & UNLINKING
// ====================================================================

// POST /api/v1/auth/link/google (Link Google account to active user)
authRouter.post('/link/google', requireAuth, async (req: PlatformRequest, res: express.Response) => {
  try {
    const { credential, code } = req.body;
    const user = req.user!;

    let googleSub = '';
    let googleEmail = '';

    if (credential) {
      const verify = await verifyGoogleIdToken(credential);
      if (!verify.success || !verify.profile) {
        return res.status(400).json({ success: false, error: 'INVALID_GOOGLE_TOKEN', message: verify.error });
      }
      googleSub = verify.profile.sub;
      googleEmail = verify.profile.email;
    } else if (code) {
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const redirectUri = `${process.env.APP_URL || `${protocol}://${host}`}/api/v1/auth/google/callback`;
      const exchange = await exchangeGoogleCodeForProfile(code, redirectUri);
      if (!exchange.success || !exchange.profile) {
        return res.status(400).json({ success: false, error: 'GOOGLE_EXCHANGE_FAILED', message: exchange.error });
      }
      googleSub = exchange.profile.sub;
      googleEmail = exchange.profile.email;
    } else {
      return res.status(400).json({ success: false, error: 'CREDENTIAL_OR_CODE_REQUIRED' });
    }

    // Check if another user already has this googleId
    const existingGoogle = db.findUserByGoogleId(googleSub);
    if (existingGoogle && existingGoogle.id !== user.id) {
      return res.status(400).json({
        success: false,
        error: 'GOOGLE_ACCOUNT_ALREADY_LINKED',
        message: 'حساب Google هذا مرتبط بحساب آخر بالفعل.',
      });
    }

    const updated = db.linkAccountProvider(user.id, 'google', {
      googleId: googleSub,
      email: googleEmail,
    });

    db.logAction(user.organizationId, user.id, user.email, 'LINK_PROVIDER', 'User', user.id, { provider: 'google' }, req.ip);

    return res.json({
      success: true,
      message: 'تم ربط حساب Google بنجاح',
      user: updated ? formatUserResponse(updated) : undefined,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/link/phone (Link verified phone to active user)
authRouter.post('/link/phone', requireAuth, (req: PlatformRequest, res: express.Response) => {
  try {
    const { phone, code } = req.body;
    const user = req.user!;

    const phoneNorm = normalizePhoneNumber(phone);
    if (!phoneNorm.isValid) {
      return res.status(400).json({ success: false, error: 'INVALID_PHONE', message: phoneNorm.error });
    }

    const activeOtp = db.getLatestActivePhoneOtp(phoneNorm.e164);
    if (!activeOtp) {
      return res.status(400).json({ success: false, error: 'OTP_NOT_FOUND', message: 'رمز التحقق غير صالح أو منتهي الصلاحية' });
    }

    if (!verifyOtp(code, activeOtp.otpHash)) {
      return res.status(400).json({ success: false, error: 'INVALID_OTP', message: 'رمز التحقق غير صحيح' });
    }

    db.markPhoneOtpUsed(activeOtp.id);

    // Check if phone belongs to another user
    const existingUser = db.findUserByPhone(phoneNorm.e164);
    if (existingUser && existingUser.id !== user.id) {
      return res.status(400).json({
        success: false,
        error: 'PHONE_ALREADY_LINKED',
        message: 'رقم الهاتف هذا مرتبط بحساب مستخدم آخر',
      });
    }

    const updated = db.linkAccountProvider(user.id, 'phone', { phone: phoneNorm.e164 });

    db.logAction(user.organizationId, user.id, user.email, 'LINK_PROVIDER', 'User', user.id, { provider: 'phone' }, req.ip);

    return res.json({
      success: true,
      message: 'تم ربط رقم الهاتف بنجاح',
      user: updated ? formatUserResponse(updated) : undefined,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// DELETE /api/v1/auth/unlink/:provider (Unlink an authentication provider)
authRouter.delete('/unlink/:provider', requireAuth, (req: PlatformRequest, res: express.Response) => {
  try {
    const provider = req.params.provider as AuthProviderType;
    const user = req.user!;

    if (!['email', 'phone', 'google'].includes(provider)) {
      return res.status(400).json({ success: false, error: 'INVALID_PROVIDER', message: 'مزود الهوية غير صالح' });
    }

    const result = db.unlinkAccountProvider(user.id, provider);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message:
          result.error === 'CANNOT_UNLINK_LAST_PROVIDER'
            ? 'لا يمكن إلغاء ربط وسيلة تسجيل الدخول الوحيدة المتبقية في حسابك'
            : 'فشل إلغاء ربط المزود',
      });
    }

    db.logAction(user.organizationId, user.id, user.email, 'UNLINK_PROVIDER', 'User', user.id, { provider }, req.ip);

    return res.json({
      success: true,
      message: `تم إلغاء ربط ${provider} بنجاح`,
      user: result.user ? formatUserResponse(result.user) : undefined,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ====================================================================
// 6. PROFILE & MULTI-TENANT SWITCHER
// ====================================================================

// GET /api/v1/auth/profile (Full User Identity Profile & Memberships)
authRouter.get('/profile', requireAuth, (req: PlatformRequest, res: express.Response) => {
  try {
    const user = req.user!;
    const organization = req.organization;
    return res.json({
      success: true,
      user: formatUserResponse(user),
      organization,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// PUT /api/v1/auth/profile (Update User Profile Details)
authRouter.put('/profile', requireAuth, (req: PlatformRequest, res: express.Response) => {
  try {
    const user = req.user!;
    const { fullName, avatarUrl, phone } = req.body;

    const updates: Partial<User> = {};
    if (fullName) updates.fullName = sanitizeString(fullName);
    if (avatarUrl !== undefined) updates.avatarUrl = sanitizeString(avatarUrl);
    if (phone) {
      const phoneNorm = normalizePhoneNumber(phone);
      if (phoneNorm.isValid) {
        updates.phone = phoneNorm.e164;
      }
    }

    const updated = db.updateUser(user.id, undefined, updates);

    db.logAction(user.organizationId, user.id, user.email, 'UPDATE_PROFILE', 'User', user.id, updates, req.ip);

    return res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: updated ? formatUserResponse(updated) : undefined,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// POST /api/v1/auth/switch-organization (Switch Active Multi-Tenant Context)
authRouter.post('/switch-organization', requireAuth, (req: PlatformRequest, res: express.Response) => {
  try {
    const { organizationId, organizationSlug } = req.body;
    const user = req.user!;

    let targetOrg = organizationId ? db.getOrganizationById(organizationId) : undefined;
    if (!targetOrg && organizationSlug) {
      targetOrg = db.getOrganizationBySlug(organizationSlug);
    }

    if (!targetOrg) {
      return res.status(404).json({ success: false, error: 'ORGANIZATION_NOT_FOUND', message: 'المؤسسة غير موجودة' });
    }

    // Check membership in target organization
    const membership = db.getMembership(user.id, targetOrg.id);
    if (!membership && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'NO_MEMBERSHIP_IN_ORG',
        message: 'ليس لديك عضوية في هذه المؤسسة التعليمية',
      });
    }

    const targetRole = membership?.role || user.role;
    const token = generateToken(user, targetOrg.id, targetRole);

    db.logAction(targetOrg.id, user.id, user.email, 'SWITCH_ORGANIZATION', 'Organization', targetOrg.id, {}, req.ip);

    return res.json({
      success: true,
      token,
      organization: targetOrg,
      activeRole: targetRole,
      message: `تم التبديل بنجاح إلى: ${targetOrg.name}`,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// GET /api/v1/auth/me (Legacy / Context verification)
authRouter.get('/me', requireAuth, (req: PlatformRequest, res: express.Response) => {
  return res.json({
    success: true,
    user: formatUserResponse(req.user!),
    organization: req.organization,
  });
});

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, (req: PlatformRequest, res: express.Response) => {
  if (req.user && req.organization) {
    db.logAction(req.organization.id, req.user.id, req.user.email, 'LOGOUT', 'User', req.user.id, {}, req.ip);
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ====================================================================
// 7. DEMO SWITCH (FORBIDDEN IN PRODUCTION)
// ====================================================================
authRouter.post('/demo-switch', (req: PlatformRequest, res: express.Response) => {
  // Production security guard: Demo persona switching is forbidden in production environments
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'DEMO_DISABLED',
      message: 'Demo persona switching is disabled in production environment.',
    });
  }

  try {
    const { persona, tenantSlug } = req.body;
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
      user: formatUserResponse(user),
      organization: org,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ====================================================================
// 8. SCHOOL REGISTRATION WIZARD
// ====================================================================
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
      emailVerified: true,
      authProviders: ['email'],
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
      user: formatUserResponse(admin),
      organization: org,
      initialAcademicSetup: {
        academicYearId: year.id,
        termId: term.id,
        gradeLevelId: grade.id,
        classroomId: classroom.id,
        subjectId: subject.id,
      },
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});

// ====================================================================
// 9. INVITATIONS SYSTEM
// ====================================================================

// POST /api/v1/auth/invitations
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

      const existingUser = db.findUserByEmail(normalizedEmail, req.organization!.id);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'USER_EXISTS',
          message: 'المستخدم مسجل بالفعل في هذه المدرسة',
        });
      }

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

// GET /api/v1/auth/invitations
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

// DELETE /api/v1/auth/invitations/:id
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

// GET /api/v1/auth/invitations/verify
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

// POST /api/v1/auth/invitations/accept
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
      emailVerified: true,
      authProviders: ['email'],
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
      req.ip
    );

    return res.json({
      success: true,
      token,
      user: formatUserResponse(newUser),
      organization: org,
    });
  } catch {
    return res.status(500).json({ success: false, error: 'SERVER_ERROR' });
  }
});
