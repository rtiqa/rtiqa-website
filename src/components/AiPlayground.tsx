import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Play, Copy, Check, Terminal, Cpu, Bot, Layers } from 'lucide-react';

export const AiPlayground: React.FC = () => {
  const { isRtl, t } = useLanguage();
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const samplePrompts = t.samplePrompts;

  const sampleResponsesEn = [
    `{
  "module": "Rtiqa Teacher AI Co-pilot",
  "status": "Generated in 0.42s",
  "lessonPlan": {
    "topic": "Newton's Laws of Motion",
    "gradeLevel": "Grade 9-11",
    "duration": "45 Minutes",
    "learningOutcomes": [
      "Explain Inertia using everyday objects",
      "Calculate Acceleration given Force and Mass (F=ma)",
      "Identify Action-Reaction forces in collisions"
    ],
    "structure": [
      {"time": "00-07m", "phase": "Hook & Simulation", "activity": "Interactive PhET physics collision sandbox on Rtiqa LMS"},
      {"time": "07-25m", "phase": "Socratic Guided Discovery", "activity": "Teacher AI co-pilot prompts small groups with diagnostic questions"},
      {"time": "25-38m", "phase": "Differentiated Lab", "activity": "Level A (Scaffolding), Level B (Standard), Level C (Advanced extension)"},
      {"time": "38-45m", "phase": "Exit Ticket & Auto-Grading", "activity": "Instant 3-question diagnostic quiz evaluated in real-time"}
    ],
    "aiDiagnosticRubric": "Rubric auto-indexed into Rtiqa School Gradebook."
  }
}`,
    `{
  "module": "Rtiqa Analytics Predictive Engine",
  "status": "Analysis Complete",
  "anomalyAlert": {
    "targetCohort": "Grade 10 - Section B",
    "patternDetected": "18% decrease in morning attendance & 22% drop in quiz submission latency over past 14 days",
    "rootCauseHypothesis": "Overlapping assignment deadlines in Chemistry & Algebra II",
    "recommendedInterventions": [
      "Auto-reschedule Algebra II quiz buffer window by +48 hours via Rtiqa Timetable",
      "Send supportive AI check-in message to 7 flagged students via Rtiqa Student workspace",
      "Notify Guidance Counselor Dr. Sarah with pre-populated student progress digests"
    ]
  }
}`,
    `{
  "module": "Rtiqa Student Socratic Companion",
  "status": "Interactive Tutor Active",
  "dialogue": {
    "student": "I don't get why x^2 - 5x + 6 = 0 factors to (x-2)(x-3)... why both minus?",
    "rtiqaAi": "Great question! Let's think about expanding (x - a)(x - b). When you multiply two negative numbers together, what sign do you get for the constant term at the end?",
    "student": "A positive sign!",
    "rtiqaAi": "Exactly! And when you add those two negative numbers together (-a + -b), what sign do you get for the middle term?",
    "student": "A negative sign!",
    "rtiqaAi": "Spot on! So we needed two numbers that multiply to POSITIVE 6, but add up to NEGATIVE 5. Try testing -2 and -3 now!",
    "masteryGained": "+15 XP in Quadratic Factorization"
  }
}`,
    `{
  "module": "Rtiqa Parent Intelligence Digest",
  "status": "Digest Generated",
  "summary": {
    "studentName": "Youssef Al-Mansoor",
    "period": "Week of August 3 - August 9, 2026",
    "highlights": [
      "Mastered 94% of Advanced Newton Kinematics exercises",
      "Demonstrated exemplary leadership in Biology Lab Collaborative Project",
      "100% On-time assignment completion rate"
    ],
    "teacherNote": "Youssef is demonstrating fantastic analytical curiosity this week.",
    "suggestedHomeActivities": "Ask Youssef to explain how inertia keeps planetary orbits stable during stargazing!"
  }
}`
  ];

  const sampleResponsesAr = [
    `{
  "الوحدة": "مساعد رتقاء الذكي للمعلمين",
  "الحالة": "تم التوليد في 0.42 ثانية",
  "خطة_الدرس": {
    "الموضوع": "قوانين نيوتن للحركة",
    "المستوى": "الصف التاسع - الحادي عشر",
    "المدة": "45 دقيقة",
    "مخرجات_التعلم": [
      "شرح مفهوم القصور الذاتي باستخدام أمثلة واقعية",
      "حساب التسارع بناءً على القوة والكتلة (ق = ك × ت)",
      "تحديد قوى الفعل ورد الفعل عند التصادم"
    ],
    "الهيكل": [
      {"الزمن": "00-07د", "المرحلة": "التمهيد والمحاكاة", "النشاط": "محاكاة تفاعلية للتصادم على منصة رتقاء LMS"},
      {"الزمن": "07-25د", "المرحلة": "الاستكشاف السقراطي", "النشاط": "أسئلة تشجيعية لقياس استيعاب المفاهيم"},
      {"الزمن": "25-40د", "المرحلة": "التطبيق التكيفي", "النشاط": "تمارين معالجة بالذكاء الاصطناعي بحسب المستوى"},
      {"الزمن": "40-45د", "المرحلة": "التقييم التكويني", "النشاط": "اختبار قصير آلي مع معالجة الثغرات المعرفية"}
    ]
  }
}`,
    `{
  "الوحدة": "محرك رتقاء للتحليلات التنبؤية",
  "الحالة": "اكتمل التحليل المؤسسي",
  "تنبيه_النمط": {
    "الفئة": "الصف العاشر - الشعبة ب",
    "النمط_المكتشف": "انخفاض بنسبة 18% في الحضور الصباحي وتأخر بنسبة 22% في تسليم واجبات الرياضيات خلال 14 يوماً",
    "السبب_المحتمل": "تزامن مواعيد الاختبارات النهائية لمادتي الكيمياء والجبر",
    "الإجراءات_المقترحة": [
      "إعادة تمديد مهلة تسليم واجب الجبر لمدة 48 ساعة آلياً عبر جدول رتقاء",
      "إرسال رسائل تشجيع ودعم آلي لـ 7 طلاب عبر مساحة رتقاء للطلاب",
      "إشعار المرشد الطلابي أ. محمد بملخص استباقي لحالة الطلاب"
    ]
  }
}`,
    `{
  "الوحدة": "المعلّم الذكي السقراطي للطلاب",
  "الحالة": "المحادثة التفاعلية نشطة",
  "الحوار": {
    "الطالب": "لماذا تتحلل المعادلة س^2 - 5س + 6 = 0 إلى (س-2)(س-3)... لماذا كلاهما سالب؟",
    "المساعد_الذكي": "سؤال ممتاز! لنفكر معاً: عند ضرب قوسين (س - أ)(س - ب)، ما هي إشارة الناتج الأخير عند ضرب رقمين سالبين؟",
    "الطالب": "موجبة!",
    "المساعد_الذكي": "بالضبط! وعند جمع نفس الرقمين السالبين (-أ + -ب)، ما هي إشارة الحد الأوسط؟",
    "الطالب": "سالبة!",
    "المساعد_الذكي": "أحسنت! إذن نحن نبحث عن رقمين حاصل ضربهما موجب 6، ومجموعهما سالب 5. جرب الآن ضرب -2 و -3!",
    "نقاط_الإتقان": "+15 نقطة خبرة في تحليل المعادلات التربيعية"
  }
}`,
    `{
  "الوحدة": "الملخص الأسبوعي لأولياء الأمور",
  "الحالة": "تم التوليد بنجاح",
  "الملخص": {
    "اسم_الطالب": "يوسف المنصور",
    "الفترة": "الأسبوع من 3 إلى 9 أغسطس 2026",
    "الإنجازات": [
      "إتقان 94% من تمارين ديناميكا نيوتن المتقدمة",
      "إظهار قيادة متميزة في مشروع الأحياء الميداني",
      "نسبة 100% في الالتزام بمواعيد الواجبات"
    ],
    "ملاحظة_المعلم": "يظهر يوسف شغفاً تحليلياً رائعاً هذا الأسبوع.",
    "نشاط_منزلي_مقترح": "ناقش مع يوسف كيف يحافظ القصور الذاتي على ثبات مدارات الكواكب!"
  }
}`
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setOutput(null);
    setTimeout(() => {
      setIsGenerating(false);
      const responses = isRtl ? sampleResponsesAr : sampleResponsesEn;
      setOutput(responses[selectedPromptIndex]);
    }, 1100);
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
      {/* Background Subtle Mesh */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {t.aiDemoTitle}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-mono tracking-wide">
                Live Simulation
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.aiDemoSub}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Rtiqa-AI-Engine v3.4</span>
        </div>
      </div>

      {/* Preset Prompts Selector */}
      <div className="space-y-3 mb-6">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          {isRtl ? 'اختر سيناريو اختبار جاهز:' : 'Select a preset prompt scenario:'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {samplePrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedPromptIndex(idx);
                setCustomPrompt('');
              }}
              className={`text-start p-3 rounded-2xl text-xs font-medium transition-all flex items-start gap-2.5 border ${
                selectedPromptIndex === idx && customPrompt === ''
                  ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <Bot className={`w-4 h-4 shrink-0 mt-0.5 ${selectedPromptIndex === idx ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="line-clamp-2 leading-relaxed">{promptText}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Trigger */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>
            {isRtl
              ? 'معالجة سياقية مدعومة بروابط المعرفة والبيانات السيادية'
              : 'Contextual processing powered by sovereign knowledge fabric'}
          </span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>{isRtl ? 'جاري التوليد والتحليل...' : 'Synthesizing AI Response...'}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{t.runPromptBtn}</span>
            </>
          )}
        </button>
      </div>

      {/* Output Console Box */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs text-slate-300">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>{isRtl ? 'نافذة المخرجات الذكية (JSON Response)' : 'AI Output Console (Structured Data)'}</span>
          </div>
          {output && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isRtl ? 'تم النسخ' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'نسخ' : 'Copy'}</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-4 min-h-[180px] max-h-[300px] overflow-y-auto leading-relaxed">
          {isGenerating ? (
            <div className="flex items-center justify-center py-12 text-emerald-400 gap-3">
              <Sparkles className="w-5 h-5 animate-spin" />
              <span className="font-sans text-sm animate-pulse">
                {isRtl ? 'معالجة الاستفسار واسترجاع المعرفة من محرك رتقاء...' : 'Processing query against Rtiqa Sovereign AI Graph...'}
              </span>
            </div>
          ) : output ? (
            <pre className="whitespace-pre-wrap font-mono text-emerald-300/90 dir-ltr text-left">
              {output}
            </pre>
          ) : (
            <div className="py-10 text-center text-slate-500 font-sans text-sm">
              <p>{isRtl ? 'اضغط على "توليد الاستجابة الذكية" لعرض التحليل ومخرجات الذكاء الاصطناعي' : 'Click "Generate AI Insight" above to execute real-time AI simulation'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
