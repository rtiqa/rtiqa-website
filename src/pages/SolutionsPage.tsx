import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SolutionItem, PageId } from '../types';
import { solutionsData } from '../data/translations';
import { DynamicIcon } from '../components/DynamicIcon';
import { Sparkles, CheckCircle2, ArrowRight, Shield, Layers, Users, Zap } from 'lucide-react';

interface SolutionsPageProps {
  initialSolutionId?: string;
  onOpenDemo: () => void;
  onNavigate: (page: PageId) => void;
}

export const SolutionsPage: React.FC<SolutionsPageProps> = ({
  initialSolutionId,
  onOpenDemo,
  onNavigate,
}) => {
  const { isRtl, t } = useLanguage();
  const [activeSolution, setActiveSolution] = useState<SolutionItem>(solutionsData[0]);

  useEffect(() => {
    if (initialSolutionId) {
      const found = solutionsData.find((s) => s.id === initialSolutionId);
      if (found) setActiveSolution(found);
    }
  }, [initialSolutionId]);

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-16">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-500/20">
          <Layers className="w-4 h-4" />
          <span>Tailored Educational Solutions</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'حلول رتقاء المخصصة لجميع الفئات' : 'Targeted Solutions for Every Stakeholder'}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          {isRtl
            ? 'سواء كنت تدير مجمع مدارس، أو كليّة أكاديمية، أو تبحث عن أدوات إنتاجية للمعلمين والطلاب، تمنحك رتقاء الحل المناسب.'
            : 'Whether you govern a multi-branch school network, manage an academic faculty, or teach in a classroom, Rtiqa provides specialized, connected workflows.'}
        </p>
      </section>

      {/* Interactive Tabs / Selector Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-3">
          {solutionsData.map((sol) => {
            const isActive = activeSolution.id === sol.id;
            return (
              <button
                key={sol.id}
                onClick={() => setActiveSolution(sol)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-indigo-600 text-slate-950 shadow-lg shadow-indigo-500/20 scale-105'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <DynamicIcon name={sol.icon} size={18} />
                <span>{isRtl ? sol.targetAr : sol.targetEn}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Solution Focus Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl glow-indigo">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <DynamicIcon name={activeSolution.icon} size={26} />
                </div>
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">
                    Target Cohort
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                    {isRtl ? activeSolution.targetAr : activeSolution.targetEn}
                  </h3>
                </div>
              </div>

              <h4 className="text-xl font-bold text-slate-200">
                {isRtl ? activeSolution.titleAr : activeSolution.titleEn}
              </h4>

              <p className="text-sm text-slate-300 leading-relaxed">
                {isRtl ? activeSolution.descriptionAr : activeSolution.descriptionEn}
              </p>

              {/* Key Value Benefits */}
              <div className="space-y-3 pt-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isRtl ? 'الأثر والمكاسب الرئيسية' : 'Measurable Outcomes & Benefits'}
                </h5>
                {(isRtl ? activeSolution.benefitsAr : activeSolution.benefitsEn).map((ben, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ben}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  onClick={onOpenDemo}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-slate-950 font-extrabold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isRtl ? 'طلب تطبيق هذا الحل' : 'Implement this Solution'}</span>
                </button>
              </div>
            </div>

            {/* Right Modules Blueprint */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span>{isRtl ? 'حزمة الوحدات المفعلة' : 'ACTIVATED R-MODULES'}</span>
                <span className="text-emerald-400 font-bold">READY TO DEPLOY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(isRtl ? activeSolution.modulesAr : activeSolution.modulesEn).map((mod, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                      0{idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-200">{mod}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed">
                {isRtl
                  ? 'يتم ربط هذه الحلول مباشرة ببنك معلومات رتقاء المركزية لحفظ البيانات وحمايتها وفق أعلى معايير الخصوصية والسيادة.'
                  : 'All modules automatically synchronize with Rtiqa Core Data Fabric with multi-tenant encryption & audit logging.'}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
