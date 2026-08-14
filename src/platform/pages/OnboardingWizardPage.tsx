import React, { useState } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import {
  School,
  UserCheck,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Building,
  Shield,
  Layers,
} from 'lucide-react';

interface OnboardingWizardPageProps {
  onBackToLogin: () => void;
  onSuccess: () => void;
}

export const OnboardingWizardPage: React.FC<OnboardingWizardPageProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const { registerSchool } = usePlatformAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Organization Data
  const [schoolName, setSchoolName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [slug, setSlug] = useState('');
  const [countryCode, setCountryCode] = useState('SA');

  // Step 2: Admin Account
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 3: Academic defaults
  const [academicYearName, setAcademicYearName] = useState('2026-2027');
  const [gradeName, setGradeName] = useState('الصف العاشر (الأول ثانوي)');
  const [classroomName, setClassroomName] = useState('شعبة 10-أ');
  const [subjectName, setSubjectName] = useState('الرياضيات العامة');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setSchoolName(val);
    if (!slug || slug === schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      const generated = val
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 20);
      if (generated) setSlug(generated);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await registerSchool({
        schoolName,
        slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        legalName: legalName || undefined,
        adminName,
        adminEmail,
        password: password || undefined,
        countryCode,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشلت عملية تهيئة وتسجيل المدرسة');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 flex flex-col justify-center items-center px-4 py-10 font-sans relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-2xl mb-1 shadow-lg shadow-emerald-500/10">
            R
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">تهيئة وتسجيل مدرسة جديدة</h1>
          <p className="text-xs text-slate-400">
            معالج إعداد المنظومة السحابية والمساحة الأكاديمية المستقلة (Tenant Setup)
          </p>
        </div>

        {/* Stepper Header */}
        <div className="flex items-center justify-between px-6 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
          {[
            { num: 1, title: 'هوية المدرسة', icon: Building },
            { num: 2, title: 'حساب المدير', icon: Shield },
            { num: 3, title: 'الهيكل الأكاديمي', icon: Layers },
            { num: 4, title: 'المراجعة والإطلاق', icon: Sparkles },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 font-bold transition ${
                  isActive
                    ? 'text-emerald-400'
                    : isDone
                    ? 'text-slate-300'
                    : 'text-slate-600'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-950 text-slate-600'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Wizard Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: School Identity */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  البيانات الأساسية للمدرسة
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  حدد اسم المؤسسة التعليمية ونطاقها السحابي الخاص على المنصة.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">اسم المدرسة الرسمي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مدارس الرواد الأهلية"
                  value={schoolName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">الاسم التجاري / القانوني</label>
                  <input
                    type="text"
                    placeholder="شركة الرواد للتعليم والتدريب"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">الدولة</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="SA">المملكة العربية السعودية (SA)</option>
                    <option value="AE">الإمارات العربية المتحدة (AE)</option>
                    <option value="KW">الكويت (KW)</option>
                    <option value="QA">قطر (QA)</option>
                    <option value="EG">مصر (EG)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  معرف النطاق السحابي (Tenant Slug) *
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 font-mono text-xs">
                    rtiqa.com/
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="alrowad"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  سيكون هذا المعرف الخاص بعزل بيانات مدرستك السحابية (Multi-Tenant Isolation).
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-slate-400 hover:text-slate-200 text-xs transition"
                >
                  إلغاء والعودة
                </button>
                <button
                  type="button"
                  disabled={!schoolName.trim() || !slug.trim()}
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  التالي: حساب المدير
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Administrator Credentials */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  حساب مدير النظام الرئيسي (Org Admin)
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  هذا الحساب سيمتلك الصلاحيات الكاملة لإدارة المعلمين، الطلاب، والمقررات.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">اسم المدير الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: د. عبدالرحمن الشهري"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">البريد الإلكتروني للإدارة *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@alrowad.edu.sa"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  السابق
                </button>
                <button
                  type="button"
                  disabled={!adminName.trim() || !adminEmail.trim() || password.length < 6}
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  التالي: الهيكل الأكاديمي
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Academic Initialization */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  التهيئة الأولية للبيئة التعليمية
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  سيتم إنشاء هذه السجلات تلقائياً لتتمكن من البدء فوراً فور اكتمال التسجيل.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">العام الدراسي الحالي</label>
                  <input
                    type="text"
                    value={academicYearName}
                    onChange={(e) => setAcademicYearName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">المرحلة / الصف النموذجي</label>
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
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                >
                  التالي: المراجعة والإطلاق
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review and Launch */}
          {step === 4 && (
            <div className="space-y-5 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  مراجعة تفاصيل المدرسة وتأكيد الإطلاق
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  تأكد من صحة البيانات قبل تهيئة مساحة العمل وحفظها في قاعدة البيانات.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
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
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  السابق
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleFinalSubmit}
                  className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-xl shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'جاري تهيئة المدرسة وقاعدة البيانات...' : 'تأكيد التسجيل وإطلاق مساحة العمل'}
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
