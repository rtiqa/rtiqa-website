import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { HelpCircle, ChevronDown, Search, Sparkles, MessageSquare, ShieldCheck, Cpu, Building2, ArrowRight } from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'general' | 'ai' | 'tech' | 'commercial';
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
}

const faqData: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'general',
    questionEn: 'What is Rtiqa (رتقاء)?',
    questionAr: 'ما هي شركة رتقاء (Rtiqa)؟',
    answerEn: 'Rtiqa is a global technology and artificial intelligence company building the unified digital infrastructure and intelligent operating system (AI OS) for schools, universities, and educational institutions.',
    answerAr: 'رتقاء (Rtiqa) هي شركة تقنية عالمية متخصصة في الذكاء الاصطناعي، تبني البنية الرقمية الشاملة ونظام التشغيل الذكي (AI OS) للمدارس والجامعات والمؤسسات التعليمية.'
  },
  {
    id: 'faq-2',
    category: 'general',
    questionEn: 'Who are the primary beneficiaries of the Rtiqa ecosystem?',
    questionAr: 'من هم المستفيدون الأساسيون من منظومة رتقاء؟',
    answerEn: 'Rtiqa serves school leaders, university administration, educators, students, parents, research centers, and education ministries through specialized, interconnected interfaces.',
    answerAr: 'تخدم رتقاء قيادات المدارس، إدارات الجامعات، المعلمين، الطلاب، أولياء الأمور، مراكز الأبحاث، ووزارات التعليم عبر واجهات متخصصة ومترابطة.'
  },
  {
    id: 'faq-3',
    category: 'general',
    questionEn: 'How does Rtiqa differ from traditional school management platforms (LMS / ERP)?',
    questionAr: 'ما الفرق بين رتقاء والمنصات التعليمية والإدارية التقليدية (LMS / ERP)؟',
    answerEn: 'Traditional tools are fragmented silos that add administrative load. Rtiqa provides a unified AI-native core where operations, pedagogy, real-time analytics, and personalized AI tutoring work seamlessly within a single ecosystem.',
    answerAr: 'الأدوات التقليدية عبارة عن أنظمة منفصلة تزيد العبء الإداري. بينما تقدم رتقاء نواة موحدة بالذكاء الاصطناعي يربط الإدارة والمناهج والتحليلات والمعلم الذكي في منظومة واحدة متكاملة.'
  },
  {
    id: 'faq-4',
    category: 'ai',
    questionEn: 'How does Artificial Intelligence function within Rtiqa?',
    questionAr: 'كيف يعمل الذكاء الاصطناعي داخل منظومة رتقاء؟',
    answerEn: 'Rtiqa AI combines pedagogical guardrails with localized Knowledge Graphs (RAG). It provides Socratic student tutoring, automated lesson design for teachers, and predictive analytics for administrators, keeping human educators strictly in control.',
    answerAr: 'يجمع ذكاء رتقاء الاصطناعي بين الضوابط التربوية والرسوم البيانية المعرفية المحلية (RAG). ويقدم التوجيه السقراطي عبر المعلّم الذكي، والتصميم الآلي للدروس للمعلمين، والتحليلات التنبؤية للقيادات مع الحفاظ التام على الإشراف البشري.'
  },
  {
    id: 'faq-5',
    category: 'ai',
    questionEn: 'Is student and institutional data used to train public AI models?',
    questionAr: 'هل تُستخدم بيانات الطلاب والمؤسسات لتدريب نماذج ذكاء اصطناعي عامة؟',
    answerEn: 'No. Rtiqa strictly enforces zero third-party training. Institutional records and student queries remain isolated within secure localized enterprise environments.',
    answerAr: 'لا، تلتزم رتقاء بشكل قاطع بعدم استخدام بيانات المشتركين أو استفسارات الطلاب لتدريب نماذج عامة خارجية. تظل كافة السجلات معزولة وآمنة داخل بيئة المؤسسة.'
  },
  {
    id: 'faq-6',
    category: 'tech',
    questionEn: 'Does Rtiqa support operations in low-connectivity or offline campus environments?',
    questionAr: 'هل تدعم رتقاء العمل في البيئات ذات الاتصال المحدود أو عند انقطاع الاتصال بالإنترنت؟',
    answerEn: 'Yes. The Rtiqa core architecture includes local edge node synchronization capabilities designed to cache attendance, grades, and resources locally during offline periods and reconcile data seamlessly once reconnected.',
    answerAr: 'نعم، تم تصميم المعمارية التقنية لـ رتقاء لدعم المزامنة السحابية الذكية وحفظ البيانات محلياً على مستوى المدرسة عند انقطاع الاتصال بالإنترنت، ثم رفعها ومزامنتها تلقائياً فور عودة الاتصال.'
  },
  {
    id: 'faq-7',
    category: 'tech',
    questionEn: 'Can Rtiqa be customized to match national curricula and institutional workflows?',
    questionAr: 'هل يمكن تخصيص رتقاء لترتبط بالمنهج الوطني والأنظمة الداخلية للمؤسسة؟',
    answerEn: 'Yes. Rtiqa is modular and configurable. Institutions can map custom grading scales, behavioral frameworks, local academic regulations, and enterprise identity standards.',
    answerAr: 'نعم، تتميز منصة رتقاء بالمرونة والبنية المعيارية، حيث يمكن ضبط معايير التقييم، اللوائح السلوكية، المناهج التعليمية، ونظام الهوية الرقمية للمؤسسة.'
  },
  {
    id: 'faq-8',
    category: 'commercial',
    questionEn: 'Which products are available today versus on the strategic product roadmap?',
    questionAr: 'ما هي المنتجات المتاحة حالياً وما المنتجات المدرجة ضمن خارطة الطريق؟',
    answerEn: 'Our core architectural capabilities (School Operating Core, Teacher Assistant, AI Tutor, Parent Portal) are ready for pilot deployments. Specialized expansions such as Rtiqa Developer API and Sovereign Ministry Dashboard are under active staged development on our roadmap.',
    answerAr: 'الإمكانات الأساسية (النواة المدرسية، مساعد المعلم، المعلّم الذكي، وبوابة أولياء الأمور) جاهزة للتطبيق التجريبي المؤسسي. بينما التوسعات المتخصصة كبوابة المطورين ولوحة الوزارات السيادية هي ضمن مراحل التطوير والتوسع في خارطة الطريق.'
  },
  {
    id: 'faq-9',
    category: 'commercial',
    questionEn: 'How can our school, university, or ministry schedule a formal demonstration or pilot?',
    questionAr: 'كيف يمكن لمدرستنا أو جامعتنا أو وزارتنا طلب عرض توضيحي أو انضمام لبرنامج التجربة؟',
    answerEn: 'You can request an enterprise consultation through the "Request Demo" form or by contacting our solution architects via the Contact page. Our team will tailor a demonstration for your leadership group.',
    answerAr: 'يمكنك طلب عرض مؤسسي مباشر عبر زر "جدولة عرض توضيحي" أو من خلال التواصل عبر صفحة الاتصال. سيقوم فريق خبراء الحلول بالتواصل لتنظيم جلسة مخصصة مع قيادة مؤسستك.'
  },
  {
    id: 'faq-10',
    category: 'commercial',
    questionEn: 'How is pricing structured for educational institutions?',
    questionAr: 'كيف يتم تسعير الخدمات للمؤسسات التعليمية؟',
    answerEn: 'Rtiqa provides tailored enterprise proposals based on institutional size, campus count, required deployment modules, and hosting preferences rather than rigid fixed tier cards.',
    answerAr: 'تقدم رتقاء عروضاً مؤسسية مخصصة تعتمد على حجم المؤسسة، عدد الفروع، الموديولات المطلوبة، ونوع الاستضافة، بعيداً عن باقات الأسعار الثابتة الجامدة.'
  }
];

interface FaqPageProps {
  onNavigate: (page: PageId) => void;
  onOpenDemo: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate, onOpenDemo }) => {
  const { isRtl } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'ai' | 'tech' | 'commercial'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const filteredFaqs = faqData.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const q = isRtl ? item.questionAr : item.questionEn;
    const a = isRtl ? item.answerAr : item.answerEn;
    const matchesSearch = searchQuery.trim() === '' || 
      q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', labelEn: 'All Questions', labelAr: 'جميع الأسئلة' },
    { id: 'general', labelEn: 'General & Overview', labelAr: 'نظرة عامة والمنظومة' },
    { id: 'ai', labelEn: 'AI & Data Privacy', labelAr: 'الذكاء الاصطناعي والخصوصية' },
    { id: 'tech', labelEn: 'Architecture & Tech', labelAr: 'البنية التقنية والمزامنة' },
    { id: 'commercial', labelEn: 'Pilots & Enterprise', labelAr: 'العروض والشراكات' },
  ];

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-16">
      {/* Header Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>{isRtl ? 'الأسئلة الشائعة والإجابات' : 'Knowledge Base & FAQ'}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'الأسئلة الأكثر شيوعاً حول رتقاء' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {isRtl
            ? 'كل ما تحتاج معرفته عن رؤية رتقاء (Rtiqa)، بنية الذكاء الاصطناعي، الخصوصية والسيادة الرقمية، وطريقة الانضمام لبرنامج التجارب المؤسسية.'
            : 'Clear answers about Rtiqa AI architecture, institutional privacy, deployment options, and enterprise pilots.'}
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <Search className={`w-5 h-5 text-slate-500 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? 'ابحث عن سؤال أو كلمة مفتاحية...' : 'Search questions, features, or deployment details...'}
            className={`w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner ${
              isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'
            }`}
          />
        </div>
      </section>

      {/* Category Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isRtl ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300 mb-1">
              {isRtl ? 'لم نجد نتائج مطابقة لبحثك' : 'No matching questions found'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {isRtl ? 'جرب البحث بكلمات أخرى أو تواصل مباشرة مع فريق الخبراء.' : 'Try a different search term or send your question to our team.'}
            </p>
            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
            >
              {isRtl ? 'التواصل مع فريق رتقاء' : 'Contact Support Team'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div
                  key={item.id}
                  className={`border rounded-2xl transition overflow-hidden ${
                    isOpen
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="w-full text-start p-5 sm:p-6 flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-bold text-slate-100 leading-snug">
                      {isRtl ? item.questionAr : item.questionEn}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-emerald-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-slate-300 text-sm leading-relaxed border-t border-slate-800/50 pt-4 space-y-3">
                      <p>{isRtl ? item.answerAr : item.answerEn}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Box */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-start">
            <h3 className="text-xl font-bold text-slate-100">
              {isRtl ? 'لديك استفسار آخر لم تجد إجابته؟' : 'Have a custom inquiry or special requirement?'}
            </h3>
            <p className="text-xs text-slate-400">
              {isRtl
                ? 'فريق المهندسين واستشاريي الحلول في رتقاء مستعدون للإجابة وتنسيق عرض مخصص لمؤسستك.'
                : 'Our solutions engineering group is ready to brief your leadership team and address infrastructure technicalities.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenDemo}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRtl ? 'طلب عرض توضيحي' : 'Request Demo'}</span>
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{isRtl ? 'التواصل المباشر' : 'Contact Us'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
