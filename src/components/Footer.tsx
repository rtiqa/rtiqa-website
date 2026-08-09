import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { Globe, Mail, ArrowRight, ShieldCheck, Sparkles, Check, Github, Twitter, Linkedin } from 'lucide-react';
import { productsData } from '../data/translations';

interface FooterProps {
  onNavigate: (page: PageId, detailId?: string) => void;
  onOpenDemo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenDemo }) => {
  const { language, toggleLanguage, isRtl, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden text-slate-300">
      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Col 1: Brand & Subscriptions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-indigo-600 p-[1.5px]">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-indigo-300 text-xl font-sans">
                    R
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold tracking-tight text-slate-100 font-sans">
                    Rtiqa
                  </span>
                  <span className="text-base font-bold text-emerald-400 font-arabic">
                    رتقاء
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  AI OS for Education
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {t.footerDesc}
            </p>

            {/* Newsletter */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                {t.subscribeNewsletter}
              </label>
              <form onSubmit={handleSubscribe} className="flex items-center gap-2 max-w-sm">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shrink-0"
                >
                  {t.subscribeBtn}
                </button>
              </form>
              {subscribed && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <Check className="w-3 h-3" />
                  {t.subscribedMsg}
                </p>
              )}
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {isRtl ? 'التنقل في الموقع' : 'Platform Navigation'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-emerald-400 transition">
                  {t.navHome}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-emerald-400 transition">
                  {t.navProducts}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('solutions')} className="hover:text-emerald-400 transition">
                  {t.navSolutions}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('ai')} className="hover:text-emerald-400 transition flex items-center gap-1">
                  <span>{t.navAi}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-emerald-400 transition">
                  {t.navAbout}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('blog')} className="hover:text-emerald-400 transition">
                  {t.navBlog}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-emerald-400 transition">
                  {t.navContact}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-emerald-400 transition text-start">
                  {t.navFaq}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('case-studies')} className="hover:text-emerald-400 transition text-start">
                  {t.navCaseStudies}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Products Ecosystem */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {isRtl ? 'منظومة المنتجات' : 'Rtiqa Ecosystem'}
            </h4>
            <ul className="space-y-2 text-xs">
              {productsData.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => onNavigate('products', p.id)}
                    className="hover:text-emerald-400 transition text-start"
                  >
                    {isRtl ? p.nameAr : p.nameEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Trust & Developer */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {isRtl ? 'الأمان والحوكمة' : 'Governance & Developers'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('legal', 'security')} className="hover:text-emerald-400 transition flex items-center gap-1.5 text-start">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{t.securitySovereignty}</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products', 'rtiqa-developer')} className="hover:text-emerald-400 transition text-start">
                  {t.developerPortal}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('legal', 'terms')} className="hover:text-emerald-400 transition text-start">
                  {t.termsOfService}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('legal', 'governance')} className="hover:text-emerald-400 transition text-start">
                  {isRtl ? 'حوكمة الذكاء الاصطناعي' : 'AI Governance'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('legal', 'privacy')} className="hover:text-emerald-400 transition text-start">
                  {t.privacyPolicy}
                </button>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={onOpenDemo}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500 text-slate-200 hover:text-emerald-400 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.requestDemo}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>{t.allRightsReserved}</div>

          {/* Socials & Language */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-slate-400">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-slate-100 transition" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-100 transition" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-100 transition" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
            </div>

            <button
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 text-xs flex items-center gap-1.5 transition"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
