import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { valuesData } from '../data/translations';
import { DynamicIcon } from '../components/DynamicIcon';
import { Globe, ShieldCheck, Sparkles, Target, Compass, Lightbulb, Users, ArrowRight, Building2, Cpu } from 'lucide-react';

interface AboutPageProps {
  onOpenDemo: () => void;
  onNavigate: (page: PageId) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenDemo, onNavigate }) => {
  const { isRtl, t } = useLanguage();

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-20">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <Globe className="w-4 h-4" />
          <span>About Rtiqa (رتقاء)</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'تمكين مستقبل التعليم بالذكاء الاصطناعي' : 'Architecting the Future of Intelligent Education'}
        </h1>
        <p className="text-slate-400 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed">
          {isRtl
            ? 'تأسست رتقاء كشركة تقنية عالمية لحل مشكلة التشتت الرقمي في التعليم، وبناء نظام تشغيل موحد بالذكاء الاصطناعي يرفع كفاءة التعلم والإدارة والمؤسسات.'
            : 'Rtiqa was founded to bridge the gap between complex software infrastructure and modern educational needs. We build scalable AI-driven technologies that empower schools, educators, and learners globally.'}
        </p>
      </section>

      {/* Vision & Mission Split Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vision */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 glow-emerald">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100">
              {isRtl ? 'رؤية رتقاء' : 'Our Vision'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isRtl
                ? 'بناء مستقبل أكثر ذكاءً وكفاءة للتعليم من خلال الذكاء الاصطناعي والبرمجيات الحديثة والبنية الرقمية المتكاملة.'
                : 'Building a smarter future for education through AI, modern software, and integrated enterprise digital infrastructure.'}
            </p>
          </div>

          {/* Mission */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 glow-indigo">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100">
              {isRtl ? 'رسالة رتقاء' : 'Our Mission'}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {isRtl
                ? 'تمكين المدارس والمؤسسات التعليمية والمعلمين والطلاب من خلال منظومة تقنية ذكية تجعل التعليم والإدارة والتعلم أكثر كفاءة وذكاءً وسهولة.'
                : 'Empowering schools, educational institutions, teachers, and students through an intelligent technology ecosystem that makes learning, administration, and operations seamless.'}
            </p>
          </div>
        </div>
      </section>

      {/* Rtiqa Story & Philosophy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>The Rtiqa Origins</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-100">
            {isRtl ? 'قصة رتقاء وفلسفة التأسيس' : 'The Rtiqa Story & Engineering Philosophy'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-300 leading-relaxed">
            <p>
              {isRtl
                ? 'بدأت رتقاء بملاحظة دقيقة: المدارس والجامعات تستثمر ملايين الدولارات في برمجيات غير مترابطة، مما ينهك المعلمين بالمهام الروتينية ويحرم الطلاب من التعليم المخصص والتفاعلي. ومن هنا نشأت فكرة بناء نظام تشغيل بالذكاء الاصطناعي (AI Operating System).'
                : 'Rtiqa was created after realizing that educational systems worldwide were struggling with fragmented software, administrative fatigue, and one-size-fits-all instruction. We recognized that the answer was not another standalone app, but a unified AI Operating System.'}
            </p>
            <p>
              {isRtl
                ? 'نحن نؤمن بأن الذكاء الاصطناعي يجب أن يكون أداة لتمكين الإنسان وليس لاستبداله؛ يرفع من أثر المعلم، يمنح الطالب المعلّم الذكي السقراطي، ويمنح الإدارة رؤية تنبؤية واضحة للتميز المؤسسي.'
                : 'We build technology around human agency. Rtiqa AI empowers educators, excites students, and equips administrators with predictive clarity. Our architecture is designed for global scale, absolute data privacy, and cultural adaptability.'}
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-100 mb-3">
            {isRtl ? 'قيم رتقاء الجوهرية' : 'Our Core Values'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isRtl
              ? 'الركائز التي تحكم برمجياتنا، تصميمنا، وتوسعنا حول العالم.'
              : 'The principles driving our product engineering, data ethics, and global partnerships.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {valuesData.map((val, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition duration-300 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <DynamicIcon name={val.icon} size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                {isRtl ? val.titleAr : val.titleEn}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isRtl ? val.descriptionAr : val.descriptionEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Global Expansion Roadmap */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6">
          <h2 className="text-3xl font-extrabold text-slate-100">
            {isRtl ? 'التوسع العالمي والشراكات الاستراتيجية' : 'Global Footprint & Strategic Partnerships'}
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
            {isRtl
              ? 'تلتزم رتقاء بالتوسع في مختلف أسواق العالم مع الامتثال التام للسيادة الرقمية المحلية والأنظمة التعليمية الإقليمية.'
              : 'Rtiqa partners with forward-thinking ministries, school groups, and tech alliances across the Middle East, Europe, North America, and Asia.'}
          </p>

          <button
            onClick={onOpenDemo}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRtl ? 'الانضمام كشريك استراتيجي' : 'Partner with Rtiqa'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
