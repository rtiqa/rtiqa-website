import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { aiCapabilitiesData } from '../data/translations';
import { DynamicIcon } from '../components/DynamicIcon';
import { AiPlayground } from '../components/AiPlayground';
import { Sparkles, Bot, BrainCircuit, ShieldCheck, Cpu, Database, Workflow, Compass, ArrowRight } from 'lucide-react';

interface AiPageProps {
  onOpenDemo: () => void;
  onNavigate: (page: PageId) => void;
}

export const AiPage: React.FC<AiPageProps> = ({ onOpenDemo, onNavigate }) => {
  const { isRtl, t } = useLanguage();

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-20">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 border border-emerald-500/30">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Rtiqa AI Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-100 tracking-tight mb-6">
          <span className="block">{isRtl ? 'طبقة الذكاء الاصطناعي السيادي للتعليم' : 'Cognitive Intelligence Layer for Education'}</span>
        </h1>

        <p className="text-slate-400 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed">
          {isRtl
            ? 'محرك ذكاء اصطناعي صُمم خصيصاً للبيئة التعليمية، يحترم المناهج، يحمي الخصوصية، ويحفز الإبداع لدى المعلم والتفوق لدى الطالب.'
            : 'Rtiqa AI is a sovereign, pedagogically aligned cognitive engine built from the ground up to understand educational taxonomies, multi-modal learning, and institutional RAG knowledge retrieval.'}
        </p>
      </section>

      {/* Interactive AI Live Playground */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AiPlayground />
      </section>

      {/* AI Capabilities Breakdown Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-100 mb-3">
            {isRtl ? 'محاور الذكاء الاصطناعي في منظومة رتقاء' : 'Rtiqa AI Core Capabilities'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isRtl
              ? 'كيف تحول رتقاء المفهوم النظري للذكاء الاصطناعي إلى أدوات عملية ملموسة في المدرسة والجامعة.'
              : 'How Rtiqa translates cutting-edge generative models and vector knowledge graphs into practical classroom tools.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiCapabilitiesData.map((cap) => (
            <div
              key={cap.id}
              className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DynamicIcon name={cap.icon} size={24} />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {isRtl ? cap.tagAr : cap.tagEn}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors">
                {isRtl ? cap.titleAr : cap.titleEn}
              </h3>

              <p className="text-xs text-emerald-400/90 font-medium mb-4">
                {isRtl ? cap.summaryAr : cap.summaryEn}
              </p>

              <p className="text-xs text-slate-400 leading-relaxed">
                {isRtl ? cap.detailsAr : cap.detailsEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Governance & Safety Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden glow-emerald">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Pedagogical Safety & Privacy</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-100">
                {isRtl ? 'ذكاء اصطناعي آمن، موثوق، وبلا هلوسات' : 'Zero-Hallucination Guardrails & Data Privacy'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isRtl
                  ? 'تم تصميم نماذج رتقاء بحيث تتقيد بحدود المنهج المعتمد والضوابط الأخلاقية والتربوية، مع التشفير التام لبيانات الطلاب والمؤسسات وعدم استخدامها في تدريب نماذج عامة خراجية.'
                  : 'Rtiqa AI operates strictly within authorized curriculum vector indexes with fine-grained role-based access. Student data is never used to train public foundational models.'}
              </p>
            </div>

            <div className="flex justify-center md:justify-end">
              <button
                onClick={onOpenDemo}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRtl ? 'طلب عرض توضيحي لمحرك رتقاء' : 'Schedule AI Demo'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
