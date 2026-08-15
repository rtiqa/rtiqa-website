import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { Search, Globe, Menu, X, Sparkles, ChevronRight, ArrowUpRight, LogIn } from 'lucide-react';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenSearch: () => void;
  onOpenDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenSearch,
  onOpenDemo,
}) => {
  const { language, toggleLanguage, isRtl, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { id: PageId; label: string }[] = [
    { id: 'home', label: t.navHome },
    { id: 'products', label: t.navProducts },
    { id: 'solutions', label: t.navSolutions },
    { id: 'ai', label: t.navAi },
    { id: 'about', label: t.navAbout },
    { id: 'blog', label: t.navBlog },
    { id: 'contact', label: t.navContact },
  ];

  const handleNavClick = (pageId: PageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 py-3 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 group focus:outline-none"
          >
            {/* Symbol */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 p-[1.5px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 via-teal-300 to-indigo-300 text-xl font-sans tracking-tighter">
                  R
                </span>
              </div>
            </div>

            {/* Wordmark */}
            <div className="flex flex-col text-start">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-100 font-sans group-hover:text-emerald-400 transition-colors">
                  Rtiqa
                </span>
                <span className="text-sm font-bold text-emerald-400/90 font-arabic">
                  رتقاء
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase -mt-0.5">
                AI OS for Education
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                  {item.id === 'ai' && !isActive && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Search Trigger */}
            <button
              onClick={onOpenSearch}
              className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition flex items-center gap-2 text-xs"
              title="Search (Cmd+K)"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline font-mono text-[11px] text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-400 transition flex items-center gap-2 text-xs font-medium"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Launch Platform Button (Desktop) */}
            <button
              onClick={() => onNavigate('platform')}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 font-bold text-xs transition shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.launchPlatform}</span>
            </button>

            {/* Get Started CTA */}
            <button
              onClick={onOpenDemo}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.getStarted}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => onNavigate('platform')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'en' ? 'Platform' : 'المنصة'}</span>
            </button>
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 text-xs font-bold"
            >
              {language === 'en' ? 'عربي' : 'EN'}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[70px] bg-slate-950/95 border-b border-slate-800 p-6 backdrop-blur-2xl shadow-2xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onOpenSearch}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>{t.searchPlaceholder}</span>
              </span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">⌘K</span>
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-start px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
            <button
              onClick={() => handleNavClick('faq')}
              className={`w-full text-start px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                currentPage === 'faq'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{t.navFaq}</span>
              <ChevronRight className={`w-4 h-4 text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => handleNavClick('case-studies')}
              className={`w-full text-start px-4 py-3 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                currentPage === 'case-studies'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{t.navCaseStudies}</span>
              <ChevronRight className={`w-4 h-4 text-slate-500 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            {/* Launch Platform Button (Mobile Menu) */}
            <button
              onClick={() => handleNavClick('platform')}
              className="w-full py-3 rounded-xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>{t.launchPlatform}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemo();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.getStarted}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
