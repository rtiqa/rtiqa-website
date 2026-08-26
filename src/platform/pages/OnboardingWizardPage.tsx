import React, { useState, useEffect } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import {
  School,
  Building,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  LogOut,
  UserPlus,
  KeyRound,
  Compass,
  Check,
  ChevronLeft,
} from 'lucide-react';

interface OnboardingWizardPageProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export const OnboardingWizardPage: React.FC<OnboardingWizardPageProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const { user, registerSchool, joinSchool, switchMembership, logout } = usePlatformAuth();

  // Mode: 'create' | 'join'
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  // Wizard Step for 'create'
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: School Information
  const [schoolName, setSchoolName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [slug, setSlug] = useState('');
  const [countryCode, setCountryCode] = useState('SA');

  // Step 2: Admin Account
  const [adminName, setAdminName] = useState(user?.fullName || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  // Step 3: Academic Setup
  const [academicYearName, setAcademicYearName] = useState('2026-2027');
  const [gradeName, setGradeName] = useState('الصف العاشر (الأول ثانوي)');
  const [classroomName, setClassroomName] = useState('شعبة 10-أ');
  const [subjectName, setSubjectName] = useState('الرياضيات العامة');

  // Join Mode State
  const [inviteCode, setInviteCode] = useState('');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-sync user details if loaded
  useEffect(() => {
    if (user) {
      if (!adminName && user.fullName) setAdminName(user.fullName);
      if (!adminEmail && user.email) setAdminEmail(user.email);
    }
  }, [user, adminName, adminEmail]);

  const handleNameChange = (val: string) => {
    setSchoolName(val);
    if (!slug || slug === schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 24);
      if (generated) setSlug(generated);
    }
  };

  const handleCreateSchoolSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await registerSchool({
        schoolName,
        slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        legalName: legalName || undefined,
        adminName: adminName || user?.fullName || 'مدير المدرسة',
        adminEmail: adminEmail || user?.email || '',
        password: password || undefined,
        countryCode,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشلت عملية تهيئة وتسجيل المدرسة');
      setIsLoading(false);
    }
  };

  const handleJoinSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError('يرجى إدخال رمز الدعوة');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await joinSchool(inviteCode.trim());
      setSuccessMessage('تم الانضمام إلى المدرسة بنجاح!');
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'رمز الدعوة غير صالح أو منتهي الصلاحية');
      setIsLoading(false);
    }
  };

  const handleEnterMembership = async (membershipId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await switchMembership(membershipId);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل التبديل إلى المدرسة');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onBackToLogin();
  };

  const memberships = user?.memberships || [];

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 flex flex-col justify-between items-center px-4 py-8 font-sans relative overflow-x-hidden" dir="rtl">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-3xl flex items-center justify-between py-2 border-b border-slate-800/80 mb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center font-black text-slate-950 text-base">
            R
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white">منصة ارتقاء</span>
            <span className="text-[10px] text-slate-400 block font-medium">مساحة الإعداد والتهيئة (Onboarding Hub)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-semibold">{user.fullName || user.email}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                {user.role === 'SUPER_ADMIN' ? 'مشرف عام' : 'حساب شخصي'}
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-xl relative z-10 space-y-6 my-auto">
        {/* Super Admin Notice */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-xs flex items-center justify-between text-purple-200 shadow-xl shadow-purple-950/20">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <div className="font-bold text-white">أنت مسجل بحساب مشرف عام المنصة (SUPER ADMIN)</div>
                <div className="text-[11px] text-purple-300">يمكنك الدخول مباشرة للوحة القيادة أو تهيئة مدرسة جديدة.</div>
              </div>
            </div>
            <button
              onClick={onSuccess}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shrink-0"
            >
              لوحة القيادة
            </button>
          </div>
        )}

        {/* Existing Memberships Box if any */}
        {memberships.length > 0 && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-400" />
                مؤسساتك التعليمية المسجلة ({memberships.length})
              </h3>
              <span className="text-[10px] text-slate-400">اختر مدرسة للمتابعة</span>
            </div>
            <div className="space-y-2">
              {memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/40 transition"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{m.organizationName || 'المدرسة التعليمية'}</div>
                    <div className="text-[10px] text-slate-400">
                      الدور: <span className="text-emerald-400 font-semibold">{m.role}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnterMembership(m.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                  >
                    <span>دخول</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Tabs: Create vs Join */}
        <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 gap-1 text-xs">
          <button
            onClick={() => {
              setActiveTab('create');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'create'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>إنشاء مدرسة جديدة</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('join');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'join'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>الانضمام برمز دعوة</span>
          </button>
        </div>

        {/* Errors & Alerts */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: CREATE SCHOOL WIZARD */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {/* Stepper Indicator */}
            <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              {[
                { num: 1, title: 'هوية المدرسة', icon: Building },
                { num: 2, title: 'حساب المدير', icon: Shield },
                { num: 3, title: 'الهيكل الأكاديمي', icon: Layers },
                { num: 4, title: 'الإطلاق', icon: Sparkles },
              ].map((s) => {
                const Icon = s.icon;
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <div
                    key={s.num}
                    className={`flex items-center gap-1 font-bold transition ${
                      isActive ? 'text-emerald-400' : isDone ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950'
                          : isDone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="w-3 h-3" /> : s.num}
                    </div>
                    <span className="hidden sm:inline">{s.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Step Form Box */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
              {/* STEP 1: School Identity */}
              {step === 1 && (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Building className="w-4 h-4 text-emerald-400" />
                      البيانات الأساسية للمدرسة أو المؤسسة
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      ستصبح مالكاً ومديراً رئيسياً (ORG_ADMIN) لهذه المؤسسة المستقلة.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      اسم المدرسة / المؤسسة <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مدارس دار العلوم الأهلية"
                      value={schoolName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      المعرف السحابي (Slug) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 font-mono text-[10px] text-slate-500 select-none">
                        .rtiqa.com
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="dar-aluloom"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs focus:border-emerald-500 focus:outline-none pl-24"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">الاسم القانوني أو التجاري</label>
                      <input
                        type="text"
                        placeholder="شركة دار العلوم للتعليم"
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">الدولة والمنطقة الزمنية</label>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="SA">المملكة العربية السعودية (Asia/Riyadh)</option>
                        <option value="AE">الإمارات العربية المتحدة (Asia/Dubai)</option>
                        <option value="EG">جمهورية مصر العربية (Africa/Cairo)</option>
                        <option value="KW">الكويت (Asia/Kuwait)</option>
                        <option value="QA">قطر (Asia/Qatar)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      disabled={!schoolName || !slug}
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      التالي: حساب المدير
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Admin Profile */}
              {step === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      بيانات مدير النظام والمدرسة (ORG_ADMIN)
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      تم تعبئة البيانات تلقائياً من حسابك الحالي.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">الاسم الكامل لمدير المدرسة</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">البريد الإلكتروني المعتمد</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      كلمة مرور احتياطية للمؤسسة (اختياري)
                    </label>
                    <input
                      type="password"
                      placeholder="اتركه فارغاً لاستخدام تسجيل الدخول الحالي"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      السابق
                    </button>
                    <button
                      type="button"
                      disabled={!adminName || !adminEmail}
                      onClick={() => setStep(3)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40"
                    >
                      التالي: الهيكل الأكاديمي
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Academic Defaults */}
              {step === 3 && (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      التهيئة الأولية للعام الدراسي والمراحل
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      يمكنك تخصيص وإضافة المزيد من الصفوف والمقررات لاحقاً من لوحة التحكم.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">العام الدراسي الافتراضي</label>
                      <input
                        type="text"
                        value={academicYearName}
                        onChange={(e) => setAcademicYearName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">المرحلة الدراسية الأولية</label>
                      <input
                        type="text"
                        value={gradeName}
                        onChange={(e) => setGradeName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">الشعبة الأولى</label>
                      <input
                        type="text"
                        value={classroomName}
                        onChange={(e) => setClassroomName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1.5">المادة الأساسية الأولى</label>
                      <input
                        type="text"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      السابق
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      التالي: مراجعة الإطلاق
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review and Launch */}
              {step === 4 && (
                <div className="space-y-4 text-xs">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      مراجعة بيانات المدرسة وإطلاق مساحة العمل
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      تأكد من صحة البيانات قبل تثبيت مساحة العمل السحابية.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">اسم المدرسة:</span>
                      <span className="font-bold text-white">{schoolName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المعرف السحابي (Tenant Slug):</span>
                      <span className="font-mono text-emerald-400 font-bold">{slug}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">مدير النظام:</span>
                      <span className="text-white">{adminName} ({adminEmail})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">العام الدراسي:</span>
                      <span className="text-slate-300">{academicYearName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">المرحلة والشعبة الأولية:</span>
                      <span className="text-slate-300">{gradeName} - {classroomName}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    <span>
                      ستحصل على بيئة مستقلة تماماً مع تطبيق معايير الأمان وعزل البيانات وتشفير كلمات المرور.
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      السابق
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleCreateSchoolSubmit}
                      className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-xl shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? 'جاري تهيئة المدرسة...' : 'تأكيد التسجيل وإطلاق مساحة العمل'}
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: JOIN SCHOOL VIA INVITE CODE */}
        {activeTab === 'join' && (
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                الانضمام إلى مدرسة عبر رمز الدعوة
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                أدخل رمز الدعوة المرسل لك من إدارة مدرستك للانضمام فوراً (معلم، طالب، ولي أمر، أو إداري).
              </p>
            </div>

            <form onSubmit={handleJoinSchoolSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  رمز الدعوة (Invite Code) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: INV-98234-A7B"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().trim())}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm tracking-wider focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
                بمجرد إدخال رمز الدعوة والتحقق منه، سيتم ربط حسابك بالمدرسة وتعيين الصلاحيات الخاصة بك تلقائياً.
              </div>

              <button
                type="submit"
                disabled={isLoading || !inviteCode.trim()}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isLoading ? 'جاري التحقق والانضمام...' : 'الانضمام إلى المدرسة الآن'}
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-xl text-center text-[11px] text-slate-600 py-4 z-10">
        منصة ارتقاء التعليمية الذكية &copy; 2026 - جميع الحقوق محفوظة
      </footer>
    </div>
  );
};

export default OnboardingWizardPage;
