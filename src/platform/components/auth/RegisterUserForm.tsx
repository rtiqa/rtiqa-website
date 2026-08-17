import React, { useState } from 'react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import { User, Mail, Lock, Smartphone, ArrowRight, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RegisterUserFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterUserForm: React.FC<RegisterUserFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { register, isLoading, error, clearError } = usePlatformAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'PARENT'>('STUDENT');
  const [localError, setLocalError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strengthScore = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!fullName.trim() || (!email.trim() && !phone.trim())) {
      setLocalError('يرجى إدخال الاسم والبريد الإلكتروني أو رقم الهاتف');
      return;
    }

    if (password && password.length < 6) {
      setLocalError('كلمة المرور يجب أن لا تقل عن 6 أحرف');
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password || undefined,
        role,
      });
      setRegisteredSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setLocalError(err.message || 'فشل إنشاء الحساب');
    }
  };

  if (registeredSuccess) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-base font-bold text-white">تم إنشاء الحساب بنجاح!</h3>
        <p className="text-xs text-slate-300">
          تم تفعيل هويتك في المنصة، وجارٍ إعداد حسابك الدراسي...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
      {/* Role Selector */}
      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">نوع الحساب:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'STUDENT', label: 'طالب' },
            { id: 'TEACHER', label: 'معلم' },
            { id: 'PARENT', label: 'ولي أمر' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id as any)}
              className={`py-2 rounded-xl text-xs font-semibold border transition ${
                role === r.id
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">الاسم الكامل:</label>
        <div className="relative">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="الاسم الثلاثي أو الرباعي"
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs"
          />
          <User className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">البريد الإلكتروني:</label>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs"
          />
          <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
        </div>
      </div>

      {/* Phone (Optional) */}
      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">رقم الجوال (اختياري للتحقق السريع):</label>
        <div className="relative">
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+966501234567"
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-left text-xs font-mono"
          />
          <Smartphone className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-slate-300 font-semibold mb-1.5">كلمة المرور:</label>
        <div className="relative">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs font-mono"
          />
          <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
        </div>
        {password && (
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    strengthScore >= step
                      ? strengthScore >= 3
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 block text-start">
              {strengthScore < 2 && 'كلمة مرور ضعيفة'}
              {strengthScore === 2 && 'كلمة مرور متوسطة'}
              {strengthScore >= 3 && 'كلمة مرور قوية ومحمية'}
            </span>
          </div>
        )}
      </div>

      {(localError || error) && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError || error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب جديد'}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {onSwitchToLogin && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-slate-400 hover:text-emerald-400 text-xs transition"
          >
            لديك حساب بالفعل؟ تسجيل الدخول
          </button>
        </div>
      )}
    </form>
  );
};
