import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { Mail, Phone, MapPin, Send, CheckCircle2, Sparkles, Building, Globe, MessageSquare } from 'lucide-react';

interface ContactPageProps {
  onNavigate: (page: PageId) => void;
}

export const ContactPage: React.FC<ContactPageProps> = () => {
  const { isRtl, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-16">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <Mail className="w-4 h-4" />
          <span>Contact Rtiqa (رتقاء)</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'تواصل مع فريق رتقاء العالمي' : 'Connect with Rtiqa Enterprise Team'}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {isRtl
            ? 'سواء كنت ترغب في استكشاف المنظومة لمدرستك، أو الاستفسار عن حزم الذكاء الاصطناعي السيادي، فريقنا جاهز للتواصل معكم.'
            : 'Explore how Rtiqa can transform your educational system. Our enterprise solution specialists are standing by.'}
        </p>
      </section>

      {/* Main Grid: Form + Contact Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl glow-emerald">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-100">{t.formSuccessTitle}</h3>
                <p className="text-slate-300 text-sm max-w-md mx-auto">{t.formSuccessMsg}</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  {isRtl ? 'إرسال استفسار آخر' : 'Send Another Inquiry'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formName} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isRtl ? 'الاسم الكامل' : 'Full Name'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formEmail} *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@institution.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formOrg} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder={isRtl ? 'المدرسة / الجامعة' : 'Organization Name'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formSubject} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={isRtl ? 'موضوع الرسالة' : 'Inquiry Subject'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {t.formMessage} *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={isRtl ? 'اكتب تفاصيل استفسارك أو طلبك هنا...' : 'Write your inquiry or project scope here...'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>{t.formSending}</span>
                  ) : (
                    <>
                      <span>{t.formSend}</span>
                      <Send className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Contact Points & Offices */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
              <h3 className="text-xl font-bold text-slate-100">
                {isRtl ? 'قنوات التواصل المباشرة' : 'Global Headquarters & Direct Contacts'}
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono">GLOBAL ENTERPRISE EMAIL</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">contact@rtiqa.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono">OFFICIAL DOMAIN</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">rtiqa.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono">GLOBAL REGIONS</span>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">
                      {isRtl ? 'الشرق الأوسط، أوروبا، أمريكا الشمالية، وآسيا' : 'MENA, Europe, North America & Asia-Pacific'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Enterprise SLA & Support</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isRtl
                  ? 'توفر رتقاء اتفاقية مستوى خدمة (SLA) تتضمن الدعم الفني المباشر على مدار الساعة لجميع المؤسسات التعليمية المشتركة.'
                  : 'Rtiqa provides 24/7 dedicated enterprise SLA support with local implementation managers for all school networks.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
