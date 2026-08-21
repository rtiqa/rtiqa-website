import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface PasswordResetEmailParams {
  to: string;
  recipientName?: string;
  resetToken: string;
  tenantSlug?: string;
  orgName?: string;
}

export interface SchoolInvitationEmailParams {
  to: string;
  recipientName?: string;
  inviteCode: string;
  role: string;
  orgName?: string;
}

export interface EmailVerificationParams {
  to: string;
  recipientName?: string;
  verificationToken: string;
  orgName?: string;
}

class TransactionalEmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private defaultFrom: string = 'Rtiqa Platform <no-reply@rtiqa.com>';

  constructor() {
    this.initialize();
  }

  private initialize() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (from) {
      this.defaultFrom = from;
    }

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });
        this.isConfigured = true;
      } catch (err: any) {
        console.error('[EmailService] Failed to initialize SMTP transporter:', err?.message || err);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
    }
  }

  public isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  public async sendMail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const fromAddress = options.from || this.defaultFrom;

    if (!this.isReady()) {
      // In development or when SMTP is not provisioned, log safe notice without leaking secrets
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[EmailService:Dev] Simulated email to: ${options.to} | Subject: "${options.subject}"`);
      }
      return { success: true, messageId: `simulated-${Date.now()}` };
    }

    try {
      const info = await this.transporter!.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        html: options.html,
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email to ${options.to}:`, err?.message || err);
      return { success: false, error: err?.message || 'SMTP_SEND_FAILED' };
    }
  }

  /**
   * Sends a localized password reset instructions email.
   */
  public async sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<{ success: boolean; error?: string }> {
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/platform/reset-password?token=${encodeURIComponent(params.resetToken)}${
      params.tenantSlug ? `&tenant=${encodeURIComponent(params.tenantSlug)}` : ''
    }`;
    const schoolName = params.orgName || 'منصة ارتقاء التعليمية';
    const name = params.recipientName || 'عزيزنا المستخدم';

    const subject = `استعادة كلمة المرور - ${schoolName}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060b18; color: #e2e8f0; margin: 0; padding: 24px; direction: rtl; }
          .card { max-width: 540px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 12px; background: linear-gradient(135deg, #10b981, #14b8a6); color: #022c22; font-weight: 900; font-size: 22px; }
          h2 { color: #f8fafc; font-size: 20px; margin-top: 16px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background-color: #10b981; color: #022c22; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; }
          .footer { text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; pt: 16px; font-size: 12px; color: #64748b; }
          .warning { background-color: #1e1b4b; border: 1px solid #3730a3; border-radius: 10px; padding: 12px; font-size: 12px; color: #c7d2fe; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">R</div>
            <h2>طلب استعادة كلمة المرور</h2>
          </div>
          <p>مرحباً ${name}،</p>
          <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في <strong>${schoolName}</strong>.</p>
          <p>لتعيين كلمة مرور جديدة، يرجى الضغط على الزر التالي (الرابط صالح لمدة 60 دقيقة فقط):</p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">إعادة تعيين كلمة المرور</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">إذا لم تكن قد طلبت استعادة كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان.</p>
          <div class="warning">
            🔒 لحماية أمان حسابك، لا تشارك هذا الرابط مع أي شخص.
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${schoolName} - مدعوم بواسطة نظام ارتقاء RTIQA</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: params.to,
      subject,
      html,
    });
  }

  /**
   * Sends a localized invitation email to a teacher, student, or parent.
   */
  public async sendSchoolInvitationEmail(params: SchoolInvitationEmailParams): Promise<{ success: boolean; error?: string }> {
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const joinUrl = `${appUrl}/platform/join?code=${encodeURIComponent(params.inviteCode)}`;
    const schoolName = params.orgName || 'المؤسسة التعليمية';
    const name = params.recipientName || 'عزيزنا المستخدم';

    const roleMap: Record<string, string> = {
      TEACHER: 'معلم',
      STUDENT: 'طالب',
      PARENT: 'ولي أمر',
      ORG_ADMIN: 'مسؤول مدرسة',
    };
    const roleAr = roleMap[params.role] || params.role;

    const subject = `دعوة للانضمام إلى ${schoolName} كـ (${roleAr})`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060b18; color: #e2e8f0; margin: 0; padding: 24px; direction: rtl; }
          .card { max-width: 540px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 12px; background: linear-gradient(135deg, #10b981, #14b8a6); color: #022c22; font-weight: 900; font-size: 22px; }
          h2 { color: #f8fafc; font-size: 20px; margin-top: 16px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0; }
          .btn-container { text-align: center; margin: 28px 0; }
          .btn { display: inline-block; background-color: #10b981; color: #022c22; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; }
          .code-box { background-color: #020617; border: 1px dashed #334155; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #34d399; letter-spacing: 2px; }
          .footer { text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">R</div>
            <h2>دعوة انضمام إلى المؤسسة التعليمية</h2>
          </div>
          <p>مرحباً ${name}،</p>
          <p>يسر إدارة <strong>${schoolName}</strong> دعوتك للانضمام إلى نظام المدرسة الأكاديمي والتعليمي بصفتك <strong>${roleAr}</strong>.</p>
          
          <div class="code-box">
            رمز الدعوة: ${params.inviteCode}
          </div>

          <p>يمكنك تفعيل حسابك والانضمام فوراً عبر الضغط على الزر أدناه:</p>
          <div class="btn-container">
            <a href="${joinUrl}" class="btn" target="_blank">قبول الدعوة وتفعيل الحساب</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${schoolName} - منصة ارتقاء التعليمية الذكية</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendMail({
      to: params.to,
      subject,
      html,
    });
  }
}

export const emailService = new TransactionalEmailService();
