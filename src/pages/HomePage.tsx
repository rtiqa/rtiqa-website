import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Cpu,
  Building2,
  GraduationCap,
  Users,
  CheckCircle2,
  TrendingUp,
  Brain,
  Zap,
  BarChart3,
  Layers
} from 'lucide-react';
import { productsData, solutionsData, partnerOrgsData } from '../data/translations';
import { DynamicIcon } from '../components/DynamicIcon';
import { AiPlayground } from '../components/AiPlayground';

interface HomePageProps {
  onNavigate: (page: PageId, detailId?: string) => void;
  onOpenDemo: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenDemo }) => {
  const { isRtl, t } = useLanguage();

  return (
    <div className="space-y-24 sm:space-y-32 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8 backdrop-blur-md shadow-lg shadow-emerald-500/10 animate-fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{isRtl ? 'جيل جديد من الأنظمة الذكية للتعليم' : 'Next-Generation Educational Intelligence'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 font-mono text-[11px]">v3.4 Release</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-100 tracking-tight leading-[1.08] max-w-5xl mx-auto mb-6">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 font-sans">
              Rtiqa
            </span>
            <span className="block text-2xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 mt-2 font-arabic">
              رتقاء
            </span>
            <span className="block text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-200 mt-4 tracking-tight">
              {t.tagline}
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
            {t.heroSubtitle}
          </p>

          {/* Hero Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => onNavigate('about')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-slate-950 font-extrabold text-sm sm:text-base transition-all duration-300 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 group"
            >
              <span>{t.exploreRtiqa}</span>
              <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-sm sm:text-base transition-all duration-300 backdrop-blur-md flex items-center justify-center gap-2"
            >
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>{t.exploreProducts}</span>
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">99.99%</div>
              <div className="text-xs text-slate-400 mt-1">{isRtl ? 'جاهزية وسرعة البنية' : 'Enterprise Uptime'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">9 Modules</div>
              <div className="text-xs text-slate-400 mt-1">{isRtl ? 'أنظمة متكاملة مترابطة' : 'Integrated Products'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-mono">10x</div>
              <div className="text-xs text-slate-400 mt-1">{isRtl ? 'سرعة أتمتة المهام' : 'Faster Workflows'}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">Zero-Trust</div>
              <div className="text-xs text-slate-400 mt-1">{isRtl ? 'حماية وسيادة بيانات تامة' : 'Data Sovereignty'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT IS RTIQA SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden glow-emerald">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>Rtiqa Overview</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 leading-tight">
                {t.whatIsRtiqa}
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                {t.whatIsRtiqaSub}
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isRtl
                  ? 'رتقاء ليست موقع مدرسة أو تطبيقاً بسيطاً؛ بل هي شركة تقنية وذكاء اصطناعي عالمية تقدم البنية الرقمية الشاملة لنظام التشغيل التعليمي (AI OS). تجمع رتقاء بين حلول إدارة المدارس ERP، منصات التعلم LMS، المعلم الذكي للطلاب، المساعد الفائق للمعلمين، والذكاء المؤسسي للقيادات.'
                  : 'Rtiqa is an enterprise technology and AI company engineering the complete digital operating foundation for modern education. We unify school ERP operations, adaptive learning platforms, teacher co-pilots, Socratic student tutors, and executive intelligence into a cohesive cloud environment.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{isRtl ? 'بنية تحتية موحدة' : 'Unified Operating System'}</h4>
                    <p className="text-xs text-slate-400">{isRtl ? 'إلغاء التشتت والربط اليدوي بين الأنظمة' : 'Eliminates siloed third-party software'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{isRtl ? 'ذكاء اصطناعي سيادي' : 'Sovereign Educational AI'}</h4>
                    <p className="text-xs text-slate-400">{isRtl ? 'نماذج تحترم المناهج والأنظمة المحلية' : 'Curriculum-bound & highly secure'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Grid Representation */}
            <div className="relative">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs text-slate-300 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>rtiqa-system-architecture.v3</span>
                  </span>
                  <span className="text-emerald-400">{isRtl ? 'نشط 100%' : 'STATUS: ACTIVE'}</span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-200 font-bold">[LAYER 1] Rtiqa Core & Security</span>
                    <span className="text-emerald-400 text-[10px]">Cloud Fabric</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center">
                    <span className="text-emerald-300 font-bold">[LAYER 2] Rtiqa AI Engine</span>
                    <span className="text-emerald-400 text-[10px]">Cognitive RAG</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-200 font-bold">[LAYER 3] Rtiqa School & LMS</span>
                    <span className="text-indigo-400 text-[10px]">ERP & Learning</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-200 font-bold">[LAYER 4] Teacher / Student / Parent</span>
                    <span className="text-teal-400 text-[10px]">Workspaces</span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 text-center">
                  {isRtl ? 'جميع الطبقات متصلة بمركز تحليلات متكامل' : 'Real-time telemetry and bi-directional data flow'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE FUTURE OF EDUCATION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <TrendingUp className="w-4 h-4" />
            <span>Paradigm Shift</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mb-4">
            {t.futureOfEducation}
          </h2>
          <p className="text-slate-400 text-base">
            {t.futureOfEducationSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {isRtl ? 'تجاوز الأدوات المنعزلة' : 'Beyond Fragmented Software'}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isRtl
                ? 'استبدال عشرات البرامج والتطبيقات المشتتة بمنظومة سحابية واحدة تعمل بانسجام تام وتوفر رؤية مؤسسية دقيقة.'
                : 'Replace disconnected single-purpose apps with a single intelligent environment that synchronizes data across all departments.'}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {isRtl ? 'التعلم التكيفي الفردي' : 'Hyper-Personalized Pathways'}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isRtl
                ? 'تمكين الطالب من مسار تعلم فردي يتكيف مع قدراته وسرعته ويقدم التوجيه السقراطي الذكي دون إعطاء إجابات جاهزة.'
                : 'Provide every learner with an AI Socratic companion that tailors micro-lessons and problem sets to their cognitive pace.'}
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {isRtl ? 'التنبؤ والعمل الاستباقي' : 'Predictive Institutional Intelligence'}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {isRtl
                ? 'الانتقال من تسجيل الدرجات بعد فوات الأوان إلى التحليل التنبئي المبكر لتفادي التعثر الأكاديمي ودعم المعلمين.'
                : 'Shift from reactive grade recording to proactive early alerts that identify student struggle weeks before major exams.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. RTIQA ECOSYSTEM / PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Layers className="w-4 h-4" />
              <span>Full Product Suite</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
              {t.rtiqaEcosystem}
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl">
              {t.rtiqaEcosystemSub}
            </p>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 text-emerald-400 text-xs font-bold transition flex items-center gap-2 shrink-0"
          >
            <span>{isRtl ? 'عرض كافة التفاصيل والمنتجات' : 'View All Products'}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productsData.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onNavigate('products', prod.id)}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
            >
              {prod.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                  {prod.badge}
                </span>
              )}

              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <DynamicIcon name={prod.icon} size={24} />
              </div>

              <h3 className="text-xl font-bold text-slate-100 mb-1 group-hover:text-emerald-400 transition-colors">
                {isRtl ? prod.nameAr : prod.nameEn}
              </h3>
              <p className="text-xs text-emerald-400/90 font-medium mb-3">
                {isRtl ? prod.taglineAr : prod.taglineEn}
              </p>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {isRtl ? prod.descriptionAr : prod.descriptionEn}
              </p>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-emerald-400">
                <span>{isRtl ? 'استكشف المزايا' : 'Explore Product'}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. AI-POWERED INTELLIGENCE & DEMO PLAYGROUND */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            <span>AI Innovation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mb-3">
            {t.aiPoweredIntelligence}
          </h2>
          <p className="text-slate-400 text-sm">
            {t.aiPoweredIntelligenceSub}
          </p>
        </div>

        {/* Live Playground Widget */}
        <AiPlayground />
      </section>

      {/* 6. SOLUTIONS MATRIX HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl font-extrabold text-slate-100 mb-3">
              {isRtl ? 'حلول متكاملة لكل فئة في المنظومة التعليمية' : 'Tailored Solutions Across Education'}
            </h2>
            <p className="text-slate-400 text-sm">
              {isRtl
                ? 'تقدم رتقاء حلولاً مخصصة تلبي متطلبات المدارس، الجامعات، المعلمين، الطلاب، أولياء الأمور، والوزارات.'
                : 'Architected to deliver immediate, contextual value for K-12 networks, higher education, educators, students, families, and education ministries.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutionsData.map((sol) => (
              <div
                key={sol.id}
                onClick={() => onNavigate('solutions', sol.id)}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-indigo-500/50 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <DynamicIcon name={sol.icon} size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {isRtl ? sol.targetAr : sol.targetEn}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">{sol.modulesEn.length} Modules</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {isRtl ? sol.titleAr : sol.titleEn}
                </p>
                <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                  <span>{isRtl ? 'عرض استراتيجية الحل' : 'View Solution Details'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. GLOBAL VISION & PARTNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Globe2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h2 className="text-3xl font-extrabold text-slate-100 mb-3">
            {t.globalVision}
          </h2>
          <p className="text-slate-400 text-sm">
            {t.globalVisionSub}
          </p>
        </div>

        {/* Partner Logos/Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {partnerOrgsData.map((org, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 hover:bg-slate-800/50 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-extrabold text-sm tracking-wider font-mono">
                {org.logoText}
              </div>
              <div className="text-xs font-bold text-slate-200">{org.name}</div>
              <div className="text-[10px] text-emerald-400/90 font-medium">{isRtl ? org.typeAr : org.typeEn}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl glow-emerald">
          <div className="max-w-3xl mx-auto relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-100 leading-tight">
              {t.finalCtaTitle}
            </h2>
            <p className="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">
              {t.finalCtaSub}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenDemo}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-base transition shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                <span>{t.requestDemo}</span>
              </button>

              <button
                onClick={() => onNavigate('contact')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-base transition"
              >
                <span>{t.contactUs}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
