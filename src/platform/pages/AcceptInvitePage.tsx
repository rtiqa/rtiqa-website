import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { ShieldCheck, Lock, UserCheck, ArrowRight, AlertCircle, School, CheckCircle } from 'lucide-react';

interface AcceptInvitePageProps {
  initialCode?: string;
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export const AcceptInvitePage: React.FC<AcceptInvitePageProps> = ({
  initialCode = '',
  onBackToLogin,
  onSuccess,
}) => {
  const { acceptInvitation } = usePlatformAuth();
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{
    code: string;
    email: string;
    fullName?: string;
    role: string;
    classroomName?: string;
    teacherSpecialization?: string;
    organization: { id: string; name: string; slug: string; logoUrl?: string };
    expiresAt: string;
  } | null>(null);

  const handleVerifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setIsVerifying(true);
    setError(null);
    try {
      const res = await platformApi.verifyInvitation(codeToVerify);
      setInviteDetails(res.data);
      if (res.data.fullName) setFullName(res.data.fullName);
    } catch (err: any) {
      setError(err.message || 'رمز الدعوة غير صحيح أو انتهت صلاحيته');
      setInviteDetails(null);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      handleVerifyCode(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteDetails) return;

    if (password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقين');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await acceptInvitation({
        code: inviteDetails.code,
        fullName: fullName || inviteDetails.fullName,
        password,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشلت معالجة الدعوة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 flex flex-col justify-center items-center px-4 py-12 font-sans relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-2xl mb-1 shadow-lg shadow-emerald-500/10">
            R
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">قبول دعوة الانضمام</h1>
          <p className="text-xs text-slate-400">منظومة ارتقاء الذكية لإدارة المدارس والتعليم الرقمي</p>
        </div>

        {/* Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!inviteDetails ? (
            // Code Input Step
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCode(code);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  أدخل رمز الدعوة السري (Invite Code):
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: RTIQA-8K9L-2M4N"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-center text-sm font-bold tracking-wider placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || !code.trim()}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? 'جاري التحقق من الرمز...' : 'التحقق والمتابعة'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full text-center text-slate-400 hover:text-slate-200 text-xs transition pt-2"
              >
                العودة إلى تسجيل الدخول
              </button>
            </form>
          ) : (
            // Account Details & Password Creation
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Organization and Role Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <School className="w-4 h-4 shrink-0" />
                  <span className="truncate">{inviteDetails.organization.name}</span>
                </div>
                <div className="text-slate-400 flex items-center justify-between text-[11px] pt-1 border-t border-slate-900">
                  <span>
                    الدور:{' '}
                    <strong className="text-white">
                      {inviteDetails.role === 'STUDENT'
                        ? 'طالب'
                        : inviteDetails.role === 'TEACHER'
                        ? 'معلم'
                        : 'إداري'}
                    </strong>
                  </span>
                  <span className="font-mono text-slate-300">{inviteDetails.email}</span>
                </div>
                {inviteDetails.classroomName && (
                  <div className="text-[11px] text-slate-400">
                    الشعبة الدراسية: <strong className="text-emerald-300">{inviteDetails.classroomName}</strong>
                  </div>
                )}
                {inviteDetails.teacherSpecialization && (
                  <div className="text-[11px] text-slate-400">
                    التخصص: <strong className="text-emerald-300">{inviteDetails.teacherSpecialization}</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اسم المستخدم الكامل"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">كلمة المرور الجديدة:</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">تأكيد كلمة المرور:</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                {isSubmitting ? 'جاري تفعيل الحساب...' : 'تفعيل الحساب والدخول للمنصة'}
              </button>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setInviteDetails(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  استخدام رمز دعوة آخر
                </button>
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
