export interface SmsSendResult {
  success: boolean;
  provider: string;
  messageId?: string;
  isSimulated?: boolean;
  error?: string;
}

export interface ISmsProvider {
  name: string;
  sendOtp(phone: string, otp: string, purpose?: 'login' | 'verify' | 'reset'): Promise<SmsSendResult>;
}

// 1. Phone number normalization to strict international E.164 format (+[country][number])
export function normalizePhoneNumber(rawPhone: unknown): { isValid: boolean; e164: string; error?: string } {
  if (typeof rawPhone !== 'string' || !rawPhone.trim()) {
    return { isValid: false, e164: '', error: 'رقم الهاتف مطلوب' };
  }

  let cleaned = rawPhone.trim().replace(/[\s\-()]/g, '');

  // Convert Arabic/Indic numerals to Western Arabic digits
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(arabicNumerals[i], i.toString());
  }

  // Handle local 05 / 00 prefixes for GCC & International
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (cleaned.startsWith('05') && cleaned.length === 10) {
    // Saudi local format (05XXXXXXXX -> +9665XXXXXXXX)
    cleaned = '+966' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('966') || cleaned.startsWith('967') || cleaned.startsWith('971') || cleaned.startsWith('20') || cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    } else {
      // Default to Saudi Arabia if 9 digits starting with 5
      if (cleaned.startsWith('5') && cleaned.length === 9) {
        cleaned = '+966' + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
  }

  // Validate E.164 regex: + followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      isValid: false,
      e164: cleaned,
      error: 'صيغة رقم الهاتف الدولي غير صالحة. يرجى إدخال الرقم مع مفتاح الدولة الدولي (مثال: +966501234567)',
    };
  }

  return { isValid: true, e164: cleaned };
}

// 2. Development & Test In-Memory / Console Logger SMS Provider
export class DevConsoleSmsProvider implements ISmsProvider {
  name = 'dev-console';
  private sentMessages: Array<{ phone: string; otp: string; timestamp: number }> = [];

  async sendOtp(phone: string, otp: string, purpose = 'login'): Promise<SmsSendResult> {
    this.sentMessages.push({ phone, otp, timestamp: Date.now() });

    if (process.env.NODE_ENV !== 'test') {
      console.info(`[SMS Provider: Dev/Sandbox] To: ${phone} | Code: [${otp}] | Purpose: ${purpose}`);
    }

    return {
      success: true,
      provider: this.name,
      messageId: `msg_dev_${Date.now()}`,
      isSimulated: true,
    };
  }

  getLastOtpForPhone(phone: string): string | undefined {
    const match = this.sentMessages
      .slice()
      .reverse()
      .find((m) => m.phone === phone);
    return match?.otp;
  }
}

// 3. Twilio SMS Provider for Production
export class TwilioSmsProvider implements ISmsProvider {
  name = 'twilio';
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromNumber = fromNumber;
  }

  async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: phone,
        From: this.fromNumber,
        Body: `رمز التحقق الخاص بك في منصة ارتقاء التعليمية هو: ${otp} (صالح لمدة 10 دقائق). لا تشارك الرمز مع أي شخص.`,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          provider: this.name,
          error: `Twilio API Error (${response.status}): ${errText}`,
        };
      }

      const data = await response.json() as { sid?: string };
      return {
        success: true,
        provider: this.name,
        messageId: data.sid,
        isSimulated: false,
      };
    } catch (err: unknown) {
      return {
        success: false,
        provider: this.name,
        error: err instanceof Error ? err.message : 'Unknown Twilio network error',
      };
    }
  }
}

// 4. SMS Provider Factory & Singleton Dispatcher
export function getActiveSmsProvider(): ISmsProvider {
  const providerType = (process.env.SMS_PROVIDER || '').toLowerCase().trim();

  if (providerType === 'twilio') {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (sid && token && from) {
      return new TwilioSmsProvider(sid, token, from);
    }
  }

  // Default fallback for dev/test/preview environments
  return devSmsProviderInstance;
}

export const devSmsProviderInstance = new DevConsoleSmsProvider();
