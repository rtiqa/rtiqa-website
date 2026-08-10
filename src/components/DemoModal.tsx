import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Send, CheckCircle2, AlertCircle, Sparkles, Building, Mail, User, MessageSquare } from 'lucide-react';
import { submitDemoRequest, validateEmail } from '../services/formService';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose }) => {
  const { isRtl, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    orgType: t.orgTypes[0],
    role: '',
    subject: '',
    message: ''
  });

  if (!isOpen) return null;

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

    const result = await submitDemoRequest(formData);

    setLoading(false);

    if (result.success) {
      setSubmitted(true);
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

  const handleReset = () => {
    setSubmitted(false);
    setErrorMessage(null);
    setValidationErrors({});
    setFormData({
      name: '',
      email: '',
      organization: '',
      orgType: t.orgTypes[0],
      role: '',
      subject: '',
      message: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 glow-emerald">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">{t.demoModalTitle}</h3>
              <p className="text-xs text-slate-400">{t.demoModalSub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-100">{t.formSuccessTitle}</h4>
              <p className="text-sm text-slate-300 max-w-md mx-auto">{t.formSuccessMsg}</p>
              <button
                onClick={handleReset}
                className="mt-6 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
              >
                {t.closeModal}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {errorMessage && (
                <div role="alert" className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold">{t.formErrorTitle}</p>
                    <p className="text-slate-300 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="demo-name" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    {t.formName} *
                  </label>
                  <input
                    id="demo-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
                    }}
                    placeholder={isRtl ? 'د. أحمد علي' : 'Dr. Sarah Jenkins'}
                    aria-invalid={!!validationErrors.name}
                    className={`w-full bg-slate-950/80 border ${
                      validationErrors.name ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                    } text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition`}
                  />
                  {validationErrors.name && (
                    <p className="text-red-400 text-[11px] mt-1">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="demo-email" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    {t.formEmail} *
                  </label>
                  <input
                    id="demo-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                    }}
                    placeholder="name@institution.edu"
                    aria-invalid={!!validationErrors.email}
                    className={`w-full bg-slate-950/80 border ${
                      validationErrors.email ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                    } text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition`}
                  />
                  {validationErrors.email && (
                    <p className="text-red-400 text-[11px] mt-1">{validationErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="demo-org" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    {t.formOrg} *
                  </label>
                  <input
                    id="demo-org"
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => {
                      setFormData({ ...formData, organization: e.target.value });
                      if (validationErrors.organization) setValidationErrors({ ...validationErrors, organization: '' });
                    }}
                    placeholder={isRtl ? 'مدارس المستقبل الدولية' : 'Global Education Network'}
                    aria-invalid={!!validationErrors.organization}
                    className={`w-full bg-slate-950/80 border ${
                      validationErrors.organization ? 'border-red-500' : 'border-slate-800 focus:border-emerald-500'
                    } text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition`}
                  />
                  {validationErrors.organization && (
                    <p className="text-red-400 text-[11px] mt-1">{validationErrors.organization}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="demo-type" className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t.formType}
                  </label>
                  <select
                    id="demo-type"
                    value={formData.orgType}
                    onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition"
                  >
                    {t.orgTypes.map((type) => (
                      <option key={type} value={type} className="bg-slate-900 text-slate-100">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="demo-message" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  {t.formMessage}
                </label>
                <textarea
                  id="demo-message"
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={isRtl ? 'صف احتياجات مؤسستك أو عدد المدارس والطلاب...' : 'Describe your institution scale, goals, or desired solutions...'}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm font-medium transition"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

