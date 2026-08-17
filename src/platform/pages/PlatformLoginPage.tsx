import React, { useState } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import {
  ShieldCheck,
  Sparkles,
  Building2,
  UserCheck,
  GraduationCap,
  ArrowRight,
  Send,
  PlusCircle,
  Lock,
  Mail,
  Smartphone,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { AcceptInvitePage } from './AcceptInvitePage';
import { OnboardingWizardPage } from './OnboardingWizardPage';
import { PhoneOtpLoginForm } from '../components/auth/PhoneOtpLoginForm';
import { RegisterUserForm } from '../components/auth/RegisterUserForm';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

interface PlatformLoginPageProps {
  onBackToMarketing: () => void;
}

type AuthTab = 'PASSWORD' | 'OTP' | 'REGISTER' | 'ACCEPT_INVITE' | 'ONBOARDING_WIZARD';

export const PlatformLoginPage: React.FC<PlatformLoginPageProps> = ({ onBackToMarketing }) => {
  const { login, demoSwitch, isLoading, error, clearError } = usePlatformAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>('PASSWORD');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('horizon');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  if (activeTab === 'ACCEPT_INVITE') {
    return (
      <AcceptInvitePage
        onBackToLogin={() => setActiveTab('PASSWORD')}
        onSuccess={() => {
          // Auth context handles state
        }}
      />
    );
  }

  if (activeTab === 'ONBOARDING_WIZARD') {
    return (
      <OnboardingWizardPage
        onBackToLogin={() => setActiveTab('PASSWORD')}
        onSuccess={() => {
          // Auth context handles state
        }}
      />
    );
  }

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    try {
      await login(identifier, password || undefined, selectedTenant);
    } catch {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans">
      {/* Subtle Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[320px] h-[320px] bg-teal-500/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-xl bg-slate-900/85 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl z-10 space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-1">
            <span className="font-black text-slate-950 text-xl">R</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            منظومة ارتقاء التعليمية الذكية
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            بوابة تسجيل الدخول وإدارة الهوية الموحدة للمدارس والمعلمين والطلاب
          </p>
        </div>

        {/* Primary Auth Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PASSWORD');
              clearError();
            }}
            className={`py-2 px-1 rounded-xl transition text-center ${
              activeTab === 'PASSWORD'
                ? 'bg-emerald-500 text-slate-950 shadow font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            كلمة المرور
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('OTP');
              clearError();
            }}
            className={`py-2 px-1 rounded-xl transition text-center ${
              activeTab === 'OTP'
                ? 'bg-emerald-500 text-slate-950 shadow font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            رمز الجوال
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER');
              clearError();
            }}
            className={`py-2 px-1 rounded-xl transition text-center ${
              activeTab === 'REGISTER'
                ? 'bg-emerald-500 text-slate-950 shadow font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            حساب جديد
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACCEPT_INVITE')}
            className="py-2 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition text-center flex items-center justify-center gap-1"
          >
            <Send className="w-3 h-3" />
            دعوة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ONBOARDING_WIZARD')}
            className="py-2 px-1 rounded-xl text-emerald-400 hover:text-emerald-300 transition text-center flex items-center justify-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            مدرسة
          </button>
        </div>

        {/* Tab 1: Email / Phone Password Login */}
        {activeTab === 'PASSWORD' && (
          <div className="space-y-4">
            {/* Google Fast Sign-In */}
            <div className="space-y-2">
              <GoogleAuthButton />
              <div className="flex items-center gap-3 my-2">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[11px] text-slate-400 font-medium">أو بالبريد الإلكتروني / الهاتف</span>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">البريد الإلكتروني أو رقم الهاتف:</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      clearError();
                    }}
                    placeholder="name@school.edu.sa أو +966501234567"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300">كلمة المرور:</label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError();
                    }}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
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
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Phone Number OTP */}
        {activeTab === 'OTP' && <PhoneOtpLoginForm />}

        {/* Tab 3: Register New User */}
        {activeTab === 'REGISTER' && (
          <RegisterUserForm
            onSwitchToLogin={() => setActiveTab('PASSWORD')}
            onSuccess={() => {
              // Context logged in
            }}
          />
        )}

        {/* Tenant Switcher & Evaluation Personas */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          {/* Tenant Selector for Multi-Tenant Isolation */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              المدرسة المستهدفة:
            </span>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="horizon">مدارس الأفق الذكية (Horizon Smart Schools)</option>
              <option value="elite">أكاديمية النخبة الدولية (Elite Academy)</option>
            </select>
          </div>

          {/* Persona Demos for Evaluation */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                حسابات تجريبية سريعة للتقييم:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => demoSwitch('admin', selectedTenant)}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 text-start transition"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[11px] text-emerald-300">مدير مدرسة</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">د. خالد المنصور</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => demoSwitch('teacher', selectedTenant)}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10 text-start transition"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[11px] text-blue-300">معلم</span>
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">أ. سارة الرويلي</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => demoSwitch('student', selectedTenant)}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 text-start transition"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-[11px] text-amber-300">طالب</span>
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">عمر السعيد</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Link */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={onBackToMarketing}
            className="text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            ← العودة للموقع التعريفي العام (rtiqa.com)
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};
