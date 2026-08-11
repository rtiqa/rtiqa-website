import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { Mail, Send, CheckCircle2, AlertCircle, Sparkles, Building, Globe } from 'lucide-react';
import { submitContactForm, validateEmail } from '../services/formService';

interface ContactPageProps {
  onNavigate: (page: PageId) => void;
}

export const ContactPage: React.FC<ContactPageProps> = () => {
  const { isRtl, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: '',
  });

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = t.formErrorRequired;
    }
    if (!formData.email.trim()) {
      errors.email = t.formErrorRequired;
    } else if (!validateEmail(formData.email)) {
      errors.email = t.formErrorEmail;
    }
    if (!formData.organization.trim()) {
      errors.organization = t.formErrorRequired;
    }
    if (!formData.subject.trim()) {
      errors.subject = t.formErrorRequired;
    }
    if (!formData.message.trim()) {
      errors.message = t.formErrorRequired;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await submitContactForm(formData);

    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        organization: '',
        subject: '',
        message: '',
      });
      setValidationErrors({});
    } else {
      if (result.error === 'INVALID_EMAIL_FORMAT') {
        setValidationErrors({ email: t.formErrorEmail });
        setErrorMessage(t.formErrorEmail);
      } else {
        setErrorMessage(result.message || t.formErrorGeneric);
      }
    }
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
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {errorMessage && (
                  <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold">{t.formErrorTitle}</p>
                      <p className="text-slate-300 mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formName} *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
                      }}
                      placeholder={isRtl ? 'الاسم الكامل' : 'Full Name'}
                      aria-invalid={!!validationErrors.name}
                      className={`w-full bg-slate-950 border ${
                        validationErrors.name ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                      } text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition`}
                    />
                    {validationErrors.name && (
                      <p className="text-red-400 text-[11px] mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formEmail} *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                      }}
                      placeholder="name@institution.com"
                      aria-invalid={!!validationErrors.email}
                      className={`w-full bg-slate-950 border ${
                        validationErrors.email ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                      } text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition`}
                    />
                    {validationErrors.email && (
                      <p className="text-red-400 text-[11px] mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-org" className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formOrg} *
                    </label>
                    <input
                      id="contact-org"
                      type="text"
                      required
                      value={formData.organization}
                      onChange={(e) => {
                        setFormData({ ...formData, organization: e.target.value });
                        if (validationErrors.organization) setValidationErrors({ ...validationErrors, organization: '' });
                      }}
                      placeholder={isRtl ? 'المدرسة / الجامعة' : 'Organization Name'}
                      aria-invalid={!!validationErrors.organization}
                      className={`w-full bg-slate-950 border ${
                        validationErrors.organization ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                      } text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition`}
                    />
                    {validationErrors.organization && (
                      <p className="text-red-400 text-[11px] mt-1">{validationErrors.organization}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-semibold text-slate-300 mb-2">
                      {t.formSubject} *
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => {
                        setFormData({ ...formData, subject: e.target.value });
                        if (validationErrors.subject) setValidationErrors({ ...validationErrors, subject: '' });
                      }}
                      placeholder={isRtl ? 'موضوع الرسالة' : 'Inquiry Subject'}
                      aria-invalid={!!validationErrors.subject}
                      className={`w-full bg-slate-950 border ${
                        validationErrors.subject ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                      } text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition`}
                    />
                    {validationErrors.subject && (
                      <p className="text-red-400 text-[11px] mt-1">{validationErrors.subject}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-300 mb-2">
                    {t.formMessage} *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (validationErrors.message) setValidationErrors({ ...validationErrors, message: '' });
                    }}
                    placeholder={isRtl ? 'اكتب تفاصيل استفسارك أو طلبك هنا...' : 'Write your inquiry or project scope here...'}
                    aria-invalid={!!validationErrors.message}
                    className={`w-full bg-slate-950 border ${
                      validationErrors.message ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                    } text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none transition resize-none`}
                  />
                  {validationErrors.message && (
                    <p className="text-red-400 text-[11px] mt-1">{validationErrors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="text-sm font-bold text-slate-200 mt-0.5">
                      <a href="mailto:info@rtiqa.com" className="hover:text-emerald-400 transition underline underline-offset-4">
                        info@rtiqa.com
                      </a>
                    </p>
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

