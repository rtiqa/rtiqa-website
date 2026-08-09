import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { ShieldCheck, FileText, Lock, Building, CheckCircle2, Globe, Sparkles } from 'lucide-react';

interface LegalPageProps {
  initialTab?: string;
  onNavigate: (page: PageId) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ initialTab = 'privacy', onNavigate }) => {
  const { isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'security' | 'governance'>('privacy');

  useEffect(() => {
    if (initialTab && ['privacy', 'terms', 'security', 'governance'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-16">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>Trust, Compliance & Governance</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'الأمان، الخصوصية، والاتفاقيات القانونية' : 'Legal Policies & Sovereign Governance'}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {isRtl
            ? 'تلتزم شركة رتقاء (Rtiqa) بأعلى معايير الحوكمة والسيادة الرقمية لحماية بيانات المؤسسات التعليمية وأولياء الأمور والطلاب.'
            : 'Rtiqa adheres to rigorous international security standards, zero-trust data protection, and localized digital sovereignty.'}
        </p>
      </section>

      {/* Selector Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-3 border-b border-slate-800 pb-6">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{isRtl ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isRtl ? 'شروط الخدمة' : 'Terms of Service'}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isRtl ? 'الأمان والامتثال' : 'Security & Compliance'}</span>
          </button>

          <button
            onClick={() => setActiveTab('governance')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'governance'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>{isRtl ? 'حوكمة البيانات الذكية' : 'AI Data Governance'}</span>
          </button>
        </div>
      </section>

      {/* Content Container */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 space-y-8 text-slate-300 text-sm leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Rtiqa Enterprise Legal</span>
                <h2 className="text-2xl font-bold text-slate-100 mt-1">
                  {isRtl ? 'سياسة الخصوصية وحماية بيانات التعلم' : 'Privacy Policy & Student Data Protection'}
                </h2>
                <span className="text-xs text-slate-500">Effective Date: January 1, 2026</span>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-100">{isRtl ? '1. التزام رتقاء بالخصوصية' : '1. Commitment to Privacy'}</h3>
                <p>
                  {isRtl
                    ? 'تلتزم شركة رتقاء (Rtiqa) بإنشاء بيئة رقمية آمنة للمؤسسات التعليمية والمعلمين والطلاب. نحن نطبق مبدأ "الخصوصية بالتصميم" (Privacy by Design) في كافة منتجاتنا وبنيتنا التحتية.'
                    : 'Rtiqa is committed to creating a secure, trusted digital architecture for schools, universities, educators, and students worldwide. Privacy is deeply embedded into our systems by design.'}
                </p>

                <h3 className="text-lg font-bold text-slate-100">{isRtl ? '2. ملكية البيانات والسيادة' : '2. Data Ownership & Sovereignty'}</h3>
                <p>
                  {isRtl
                    ? 'تعود ملكية كافة البيانات السلوكية والأكاديمية والإدارية كلياً للمؤسسات والوزارات والطلاب المشتركين. لا تقوم رتقاء ببيع أو مشاركة بيانات المشتركين مع أي طرف ثالث لأغراض إعلانية.'
                    : 'All institutional, academic, and behavioral data remains the absolute property of the respective subscribing entity. Rtiqa never monetizes or sells user data to third-party ad networks.'}
                </p>

                <h3 className="text-lg font-bold text-slate-100">{isRtl ? '3. عدم استخدام البيانات لتدريب النماذج العامة' : '3. Zero Third-Party AI Model Training'}</h3>
                <p>
                  {isRtl
                    ? 'يتم تشغيل نماذج الذكاء الاصطناعي في رتقاء ضمن مساحة معزولة (Sovereign Sandbox)، ولا تُستخدم مدخلات أو استفسارات الطلاب والمعلمين لتدريب نماذج الذكاء الاصطناعي العامة الخارجية.'
                    : 'Rtiqa AI operates strictly inside localized sovereign sandboxes. Student and institutional interactions are never used to train public foundational AI models.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Rtiqa Master Terms</span>
                <h2 className="text-2xl font-bold text-slate-100 mt-1">
                  {isRtl ? 'شروط الخدمة والاتفاقية الإطارية' : 'Enterprise Master Services Agreement'}
                </h2>
                <span className="text-xs text-slate-500">Effective Date: January 1, 2026</span>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-100">{isRtl ? '1. نطاق الخدمة' : '1. Scope of Service'}</h3>
                <p>
                  {isRtl
                    ? 'توفر رتقاء منصات تقنية وبنية تحتية سحابية للتعليم والتعلم بالذكاء الاصطناعي وفق اتفاقيات الاشتراك المؤسسي (SaaS/Enterprise Agreements).'
                    : 'Rtiqa provides cloud-hosted digital infrastructure, educational software modules, and AI tools subject to formal Enterprise SLA terms.'}
                </p>

                <h3 className="text-lg font-bold text-slate-100">{isRtl ? '2. الاستخدام المقبول' : '2. Acceptable Use'}</h3>
                <p>
                  {isRtl
                    ? 'يجب استخدام منصات رتقاء فقط لأغراض التعليم والتدريب والإدارة المؤسسية المعتمدة وفق الأنظمة واللوائح المحلية والتربوية.'
                    : 'Rtiqa platforms must be utilized exclusively for accredited educational, operational, and research purposes adhering to local academic regulations.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Security Principles & System Architecture</span>
                <h2 className="text-2xl font-bold text-slate-100 mt-1">
                  {isRtl ? 'مبادئ الأمن والسيادة الرقمية' : 'Security Principles & Sovereign Digital Architecture'}
                </h2>
                <span className="text-xs text-slate-500">{isRtl ? 'نهج أمني مؤسسي قائم على الثقة الصفرية العازلة' : 'Zero-Trust Isolation & Modern Cryptographic Infrastructure'}</span>
              </div>

              <div className="space-y-4">
                <p>
                  {isRtl
                    ? 'تعتمد رتقاء (Rtiqa) نهجاً أمنياً شاملاً صُمم من الصفر لحماية البنية الرقمية للمؤسسات التعليمية وتأمين بيانات الطلاب دون مساومة.'
                    : 'Rtiqa employs a comprehensive security-by-design approach built from the ground up to protect educational infrastructure and institutional assets.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-slate-100 text-xs">{isRtl ? 'تشفير شامل متقدم AES-256' : 'AES-256 & TLS 1.3 Cryptography'}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? 'تشفير كافة البيانات المخزنة والمنقولة عبر العقد السحابية بأعلى درجات التشفير المعيارية.' : 'Data is encrypted both at rest and in transit using end-to-end modern protocol standards.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-slate-100 text-xs">{isRtl ? 'التحكم بالوصول القائم على الأدوار RBAC' : 'Role-Based Zero-Trust Access'}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? 'صلاحيات وصول مفصلة بدقة تضمن عدم الاطلاع على سجلات الطلاب إلا من قبل الأشخاص المصرّح لهم فقط.' : 'Granular access controls ensure student academic records are strictly restricted to authorized roles.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-slate-100 text-xs">{isRtl ? 'عزل البيانات والتواجد المحلي' : 'Data Isolation & Local Hosting'}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? 'خيار استضافة البيانات داخل حدود الدولة للالتزام بالسيادة الرقمية والأنظمة الوطنية.' : 'Flexible cloud hosting options supporting localized data residency and national sovereignty rules.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-bold text-slate-100 text-xs">{isRtl ? 'سجلات المراجعة الذكية' : 'Tamper-Evident Audit Logging'}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? 'تتبع زمني دقيق لكافة التغييرات والعمليات الحساسة في النظام لضمان الشفافية الكاملة.' : 'Immutable audit trails monitor critical system actions to maintain operational compliance.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'governance' && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase">Pedagogical Ethics & Responsible AI</span>
                <h2 className="text-2xl font-bold text-slate-100 mt-1">
                  {isRtl ? 'إطار حوكمة الذكاء الاصطناعي المسؤول والتربوي' : 'Responsible AI Governance & Pedagogical Guardrails'}
                </h2>
                <span className="text-xs text-slate-500">{isRtl ? 'الذكاء الاصطناعي الموجه للبناء الفكري والإشراف البشري الكامل' : 'Human-Centered AI Built to Empower Critical Thinking & Educator Autonomy'}</span>
              </div>

              <div className="space-y-4">
                <p>
                  {isRtl
                    ? 'في شركة رتقاء (Rtiqa)، نرى أن الذكاء الاصطناعي يجب أن يكون عاملاً مكملاً ومحفزاً للقدرات البشرية، وليس بديلاً عن الدور التربوي الحاسم للمعلم.'
                    : 'At Rtiqa, we believe AI should serve as an empowering intelligence amplifier that upholds human agency and educator leadership.'}
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <h4 className="font-bold text-slate-100 text-xs">{isRtl ? '1. الإشراف البشري الكامل (Human-in-the-Loop)' : '1. Human-in-the-Loop Oversight'}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? 'جميع المخرجات والتوصيات الصادرة من الذكاء الاصطناعي تخضع لمراجعة واعتماد المعلم أو الإداري المختص قبل تطبيقها.' : 'All AI generated insights and automated workflows remain subject to human approval and educator validation.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <h4 className="font-bold text-slate-100 text-xs">{isRtl ? '2. التوجيه السقراطي ومنع حل الأسئلة الجاهزة' : '2. Socratic Guidance vs Answer Generation'}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? 'تم ضبط المعلم الذكي (AI Tutor) لتقديم تلميحات وأسئلة توجيهية تساعد الطالب على التفكير، ويرفض إعطاء الواجبات المكتملة تلقائياً.' : 'The AI Tutor encourages critical reasoning by asking guiding questions rather than delivering shortcut answers.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <h4 className="font-bold text-slate-100 text-xs">{isRtl ? '3. التقيد بالمنهج المعلم والحدود الأخلاقية' : '3. Strict Curriculum Alignment & Safety Filters'}</h4>
                    <p className="text-xs text-slate-400">
                      {isRtl ? 'تتقيد النماذج ببنك المعرفة المعتمد للمؤسسة والمناهج الرسمية، مع فلاتر أمان تمنع المحتوى غير الملائم لعمر الطالب.' : 'Rtiqa AI models are constrained strictly within the accredited institutional knowledge graph and age-appropriate guardrails.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
