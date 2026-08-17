import React, { useState, useEffect } from 'react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import { Smartphone, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PhoneOtpLoginFormProps {
  onSuccess?: () => void;
}

export const PhoneOtpLoginForm: React.FC<PhoneOtpLoginFormProps> = ({ onSuccess }) => {
  const { sendPhoneOtp, verifyPhoneOtp, isLoading, error, clearError } = usePlatformAuth();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!phone || phone.trim().length < 8) {
      setLocalError('يرجى إدخال رقم هاتف صالح مع رمز الدولة (مثال: +966501234567)');
      return;
    }

    try {
      const res = await sendPhoneOtp(phone.trim(), 'login');
      setCooldown(res.cooldownSeconds || 60);
      if (res.devOtpCode) {
        setDevCode(res.devOtpCode);
      }
      setStep('OTP');
    } catch (err: any) {
      setLocalError(err.message || 'فشل إرسال رمز التحقق');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!otpCode || otpCode.trim().length < 4) {
      setLocalError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    try {
      await verifyPhoneOtp(phone.trim(), otpCode.trim(), fullName.trim() || undefined);
      onSuccess?.();
    } catch (err: any) {
      setLocalError(err.message || 'رمز التحقق غير صحيح');
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {step === 'PHONE' ? (
        <form onSubmit={handleSendOtp} className="space-y-3.5">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">رقم الهاتف (مع الرمز الدولي):</label>
            <div className="relative">
              <input
                type="tel"
                dir="ltr"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setLocalError(null);
                }}
                placeholder="+966 50 123 4567"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-left text-xs font-mono"
              />
              <Smartphone className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              سنرسل رسالة SMS تحتوي على رمز التحقق لمرة واحدة (OTP)
            </p>
          </div>

          {(localError || error) && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !phone}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-3.5">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">تم إرسال الرمز إلى:</span>
              <span className="font-mono text-emerald-400 font-bold text-xs" dir="ltr">{phone}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('PHONE');
                setOtpCode('');
                setLocalError(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              تغيير الرقم
            </button>
          </div>

          {devCode && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                رمز الاختبار السريع:
              </span>
              <button
                type="button"
                onClick={() => setOtpCode(devCode)}
                className="font-mono font-bold px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 rounded text-emerald-200"
              >
                {devCode} (تعبئة)
              </button>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">رمز التحقق (OTP):</label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                  setLocalError(null);
                }}
                placeholder="123456"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-center text-base tracking-widest font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">الاسم الكامل (للمستخدمين الجدد):</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="الاسم الثلاثي أو المستعار"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          {(localError || error) && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            {cooldown > 0 ? (
              <span>إعادة الإرسال بعد {cooldown} ثانية</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                إعادة إرسال رمز جديد
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpCode.length < 4}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'جارٍ التحقق...' : 'تأكيد الدخول'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
