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
  AlertCircle,
} from 'lucide-react';
import { AcceptInvitePage } from './AcceptInvitePage';
import { OnboardingWizardPage } from './OnboardingWizardPage';

interface PlatformLoginPageProps {
  onBackToMarketing: () => void;
}

export const PlatformLoginPage: React.FC<PlatformLoginPageProps> = ({ onBackToMarketing }) => {
  const { login, demoSwitch, isLoading, error, clearError } = usePlatformAuth();
  const [viewMode, setViewMode] = useState<'LOGIN' | 'ACCEPT_INVITE' | 'ONBOARDING_WIZARD'>('LOGIN');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('horizon');

  if (viewMode === 'ACCEPT_INVITE') {
    return (
      <AcceptInvitePage
        onBackToLogin={() => setViewMode('LOGIN')}
        onSuccess={() => {
          // Auth context handles state
        }}
      />
    );
  }

  if (viewMode === 'ONBOARDING_WIZARD') {
    return (
      <OnboardingWizardPage
        onBackToLogin={() => setViewMode('LOGIN')}
        onSuccess={() => {
          // Auth context handles state
        }}
      />
    );
  }

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await login(email, password || undefined, selectedTenant);
    } catch {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Container Card */}
      <div className="relative w-full max-w-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl z-10 space-y-7">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-1">
            <span className="font-black text-slate-950 text-2xl">R</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            منظومة ارتقاء التعليمية الذكية
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            بوابة إدارة المدارس الرقمية، الفصول التفاعلية، ورصد الدرجات والحضور
          </p>
        </div>

        {/* Action Switcher Tabs (Login / Accept Invite / New School) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('LOGIN')}
            className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 shadow transition"
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ACCEPT_INVITE')}
            className="py-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1"
          >
            <Send className="w-3.5 h-3.5" />
            رمز دعوة
          </button>
          <button
            type="button"
            onClick={() => setViewMode('ONBOARDING_WIZARD')}
            className="py-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 transition flex items-center justify-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            تسجيل مدرسة
          </button>
        </div>

        {/* 1-Click Persona Demos for Fast Evaluation */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              الدخول السريع بحسابات تجريبية مجهزة:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Admin Demo Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => demoSwitch('admin', selectedTenant)}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 text-start transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-emerald-300">مدير مدرسة</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">د. خالد المنصور</span>
              <span className="text-[10px] text-slate-500 block truncate">admin@horizon.edu.sa</span>
            </button>

            {/* Teacher Demo Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => demoSwitch('teacher', selectedTenant)}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10 text-start transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-blue-300">معلم رياضيات</span>
                <UserCheck className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">أ. سارة الرويلي</span>
              <span className="text-[10px] text-slate-500 block truncate">teacher@horizon.edu.sa</span>
            </button>

            {/* Student Demo Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => demoSwitch('student', selectedTenant)}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 text-start transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-amber-300">طالب (10-أ)</span>
                <GraduationCap className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">عمر السعيد</span>
              <span className="text-[10px] text-slate-500 block truncate">student@horizon.edu.sa</span>
            </button>
          </div>
        </div>

        {/* Tenant Selector for Demonstrating Multi-Tenant Isolation */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            المدرسة المستهدفة (Tenant):
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

        {/* Custom Login Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني:</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
                placeholder="name@school.edu.sa"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور (اختياري للحسابات التجريبية):</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none text-xs font-mono"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

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
    </div>
  );
};
