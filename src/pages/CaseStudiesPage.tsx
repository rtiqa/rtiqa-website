import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { FileText, Sparkles, Building2, ShieldCheck, BarChart3, Clock, ArrowRight, CheckCircle2, Milestone } from 'lucide-react';

interface CaseStudiesPageProps {
  onNavigate: (page: PageId) => void;
  onOpenDemo: () => void;
}

export const CaseStudiesPage: React.FC<CaseStudiesPageProps> = ({ onNavigate, onOpenDemo }) => {
  const { isRtl } = useLanguage();

  const pilotFrameworkPillars = [
    {
      icon: Building2,
      titleEn: '1. Isolated Institutional Sandbox',
      titleAr: '1. بيئة تجريبية مؤسسية معزولة',
      descEn: 'Piloting campuses receive a dedicated sovereign tenant environment with full data encryption and local curriculum mapping.',
      descAr: 'تحصل كل مؤسسة مشاركة على بيئة معزولة بالكامل مع تشفير تام وربط مباشر بالمنهج الدراسي المحلي.'
    },
    {
      icon: ShieldCheck,
      titleEn: '2. Socratic AI Guardrails',
      titleAr: '2. ضوابط المعلم والذكاء السقراطي',
      descEn: 'Educators configure AI Tutor strictness, ensuring students receive guided inquiry rather than automated homework answers.',
      descAr: 'يحدد المعلمون درجة صرامة المعلّم الذكي، مما يضمن تلقي الطلاب للتوجيه السقراطي وتجنب الإجابات الآلية المباشرة.'
    },
    {
      icon: BarChart3,
      titleEn: '3. Empirical Efficiency Audits',
      titleAr: '3. قياس الأثر وكفاءة الأداء',
      descEn: 'Measuring teacher grading speed, administrative workflow reduction, and student active learning retention rates.',
      descAr: 'قياس دقيق لسرعة تصحيح الاختبارات، خفض الأعباء الإدارية، ونسبة تفاعل الطلاب مع أنشطة التعلم.'
    }
  ];

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-16">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>{isRtl ? 'دراسات الحالة وأبحاث الأثر' : 'Case Studies & Institutional Impact'}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'قصص النجاح وتقارير الأثر التقييمي' : 'Documented Case Studies & Pilot Research'}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {isRtl
            ? 'تلتزم رتقاء (Rtiqa) بالشفافية الكاملة والمنهجية العلمية. سيتم نشر دراسات الحالة الموثقة والنتائج الأكاديمية بالتعاون مع المؤسسات التعليمية المشاركة في برنامج التجارب المؤسسية.'
            : 'Rtiqa adheres to empirical rigor and transparency. Verified institutional case studies and pedagogical research evaluations will be published as active pilot cohorts complete their assessment cycles.'}
        </p>
      </section>

      {/* Pilot Program Announcement Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Milestone className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              {isRtl ? 'إطار التقييم المؤسسي المستمر' : 'Active Institutional Pilot Framework'}
            </span>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
              {isRtl ? 'نشر نتائج التطبيق الميداني بناءً على بيانات موثقة' : 'Publishing Outcome Data Based on Empirical Audits'}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              {isRtl
                ? 'تجري شركة رتقاء حالياً تجارب ميدانية موجّهة بالتعاون مع مجمعات مدرسية ومؤسسات تعليمية رائدة لاختبار أثر نظام التشغيل بالذكاء الاصطناعي (AI OS). نرفض تماماً نشر ادعاءات أو أرقام وهمية غير موثقة، وسنقوم بتحديث هذه الصفحة بدراسات تفصيلية فور اكتمال المراحل التقييمية.'
                : 'Rtiqa is conducting structured pilot deployments alongside forward-thinking educational networks. We strictly refrain from publishing marketing approximations or unverified claims. Comprehensive case studies will be released directly as formal pilot evaluation metrics are signed off.'}
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
            {pilotFrameworkPillars.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <IconComp className="w-5 h-5 text-emerald-400 mb-2" />
                  <h3 className="font-bold text-slate-100 text-xs">{isRtl ? p.titleAr : p.titleEn}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{isRtl ? p.descAr : p.descEn}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Evaluation Criteria Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {isRtl ? 'محاور قياس الأثر في برنامج التجارب' : 'Key Metrics Evaluated in Pilot Deployments'}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            {isRtl ? 'كيف نقيس نجاح منظومة رتقاء في المدارس والمؤسسات المشاركة:' : 'How we evaluate Rtiqa deployment outcomes across campuses:'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <Clock className="w-6 h-6 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">{isRtl ? 'توفير الوقت الإداري للمعلم' : 'Educator Administrative Hours'}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isRtl ? 'مراقبة ساعات إعداد الدروس وتصحيح الاختبارات التكوينية ومدى توفيرها للمعلم.' : 'Tracking time reduction in lesson planning, grading, and reporting administrative duties.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">{isRtl ? 'عمق التفكير والتعلم عبر المعلّم الذكي' : 'Student Critical Inquiry Depth'}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isRtl ? 'قياس نسبة الفهم والاستفسارات التفاعلية مقارنة بالتلقين التقليدي.' : 'Evaluating active learning engagement and self-directed study progress via Socratic tutoring.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">{isRtl ? 'الامتداد والأمان المؤسسي' : 'Institutional Data Safety & Compliance'}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isRtl ? 'التحقق الميداني من السيادة التامة على السجلات وعدم تسرب أي بيانات حيوية.' : 'Verifying zero-leakage enterprise isolation and alignment with regional education policies.'}
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action for Pilot Applications */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 text-center space-y-6">
          <h3 className="text-2xl font-bold text-slate-100">
            {isRtl ? 'هل ترغب مؤسستك في الانضمام لدفعة التجارب المؤسسية القادمة؟' : 'Join the Next Institutional Pilot Cohort'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            {isRtl
              ? 'تتيح رتقاء للمدارس والمجمعات المتميزة فرصة تجربة نظام التشغيل الرقمي بالذكاء الاصطناعي مجاناً ضمن نطاق تقييمي محدد ومستمر.'
              : 'Rtiqa offers select K-12 networks and universities the opportunity to evaluate our AI OS architecture within a structured pilot program.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onOpenDemo}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRtl ? 'التقديم على برنامج التجارب' : 'Apply for Institutional Pilot'}</span>
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
            >
              <span>{isRtl ? 'التواصل مع استشاري الحلول' : 'Speak with Solutions Team'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
