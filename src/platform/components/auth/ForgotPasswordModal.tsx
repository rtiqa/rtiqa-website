import React, { useState } from 'react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import { Mail, KeyRound, Lock, ArrowRight, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { forgotPassword, resetPassword, isLoading } = usePlatformAuth();

  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'DONE'>('REQUEST');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return;

    try {
      const res = await forgotPassword(email.trim());
      setMessage('تم إرسال رابط ورمز استعادة كلمة المرور بنجاح');
      if (res.devResetToken) {
        setDevToken(res.devResetToken);
      }
      setStep('RESET');
    } catch (err: any) {
      setError(err.message || 'فشل إرسال طلب الاستعادة');
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token || !newPassword) return;

    try {
      await resetPassword(token.trim(), newPassword);
      setStep('DONE');
    } catch (err: any) {
      setError(err.message || 'فشل تحديث كلمة المرور');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">استعادة كلمة المرور</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'REQUEST' && (
          <form onSubmit={handleRequest} className="space-y-3.5">
            <p className="text-slate-300">
              أدخل بريدك الإلكتروني المسجل وسنرسل لك تعليمات استعادة كلمة المرور.
            </p>
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">البريد الإلكتروني:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu.sa"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'جارٍ الإرسال...' : 'إرسال رمز الاستعادة'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {step === 'RESET' && (
          <form onSubmit={handleReset} className="space-y-3.5">
            <p className="text-slate-300">
              أدخل رمز الاستعادة المالي المرسل إليك مع كلمة المرور الجديدة.
            </p>

            {devToken && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span>رمز الاختبار السريع:</span>
                <button
                  type="button"
                  onClick={() => setToken(devToken)}
                  className="font-mono font-bold px-2 py-0.5 bg-emerald-500/20 rounded hover:bg-emerald-500/30"
                >
                  تعبئة الرمز
                </button>
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">رمز الاستعادة:</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="أدخل الرمز أو الصق الرابط"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">كلمة المرور الجديدة:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token || !newPassword}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'جارٍ الحفظ...' : 'تحديث كلمة المرور'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {step === 'DONE' && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">تم تغيير كلمة المرور بنجاح!</h4>
            <p className="text-slate-300 text-xs">
              يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow"
            >
              العودة لتسجيل الدخول
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
