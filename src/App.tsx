import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { PageId } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { DemoModal } from './components/DemoModal';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { AiPage } from './pages/AiPage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { ContactPage } from './pages/ContactPage';
import { LegalPage } from './pages/LegalPage';
import { FaqPage } from './pages/FaqPage';
import { CaseStudiesPage } from './pages/CaseStudiesPage';
import { NotFoundPage } from './pages/NotFoundPage';

const MainAppContent: React.FC = () => {
  const { isRtl, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState<PageId | 'notFound'>('home');
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Dynamic Title Management for SEO & User Experience
  useEffect(() => {
    const titlesEn: Record<string, string> = {
      home: 'Rtiqa (رتقاء) | AI Operating System for Education',
      products: 'Products & Ecosystem | Rtiqa (رتقاء)',
      solutions: 'Tailored Educational Solutions | Rtiqa (رتقاء)',
      ai: 'Sovereign AI Engine | Rtiqa (رتقاء)',
      about: 'About Us & Global Vision | Rtiqa (رتقاء)',
      blog: 'Insights & Research | Rtiqa (رتقاء)',
      contact: 'Contact Enterprise Team | Rtiqa (رتقاء)',
      legal: 'Legal Policies & Governance | Rtiqa (رتقاء)',
      security: 'Security Principles & Architecture | Rtiqa (رتقاء)',
      privacy: 'Privacy Policy & Student Data Protection | Rtiqa (رتقاء)',
      terms: 'Terms of Service & Enterprise Agreement | Rtiqa (رتقاء)',
      'ai-governance': 'Responsible AI Governance & Ethics | Rtiqa (رتقاء)',
      faq: 'Frequently Asked Questions & Knowledge Base | Rtiqa (رتقاء)',
      'case-studies': 'Case Studies & Institutional Pilot Research | Rtiqa (رتقاء)',
      notFound: '404 - Page Not Found | Rtiqa (رتقاء)'
    };

    const titlesAr: Record<string, string> = {
      home: 'رتقاء (Rtiqa) | نظام التشغيل بالذكاء الاصطناعي للتعليم',
      products: 'منظومة المنتجات والحلول | رتقاء (Rtiqa)',
      solutions: 'الحلول المخصصة للمؤسسات والتعليم | رتقاء (Rtiqa)',
      ai: 'محرك الذكاء الاصطناعي السيادي | رتقاء (Rtiqa)',
      about: 'عن الشركة والرؤية العالمية | رتقاء (Rtiqa)',
      blog: 'الأبحاث والأفكار الرقمية | رتقاء (Rtiqa)',
      contact: 'تواصل مع فريق المؤسسات | رتقاء (Rtiqa)',
      legal: 'الأمان والسيادة والحوكمة | رتقاء (Rtiqa)',
      security: 'مبادئ الأمن والسيادة الرقمية | رتقاء (Rtiqa)',
      privacy: 'سياسة الخصوصية وحماية البيانات | رتقاء (Rtiqa)',
      terms: 'شروط الخدمة والاتفاقية المؤسسية | رتقاء (Rtiqa)',
      'ai-governance': 'حوكمة الذكاء الاصطناعي والتربية | رتقاء (Rtiqa)',
      faq: 'الأسئلة الشائعة والمعرفية | رتقاء (Rtiqa)',
      'case-studies': 'قصص النجاح ودراسات الحالة | رتقاء (Rtiqa)',
      notFound: '404 - الصفحة غير موجودة | رتقاء (Rtiqa)'
    };

    const pageTitle = (isRtl ? titlesAr[currentPage] : titlesEn[currentPage]) || titlesEn.home;
    document.title = pageTitle;
  }, [currentPage, isRtl, language]);

  // Sync hash routing if user manually navigates or uses back button
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const parts = hash.split('/');
        const page = parts[0] as PageId;

        // Alias routing for security/privacy/terms/ai-governance
        if (['security', 'privacy', 'terms'].includes(page)) {
          setCurrentPage('legal');
          setDetailId(page);
        } else if (page === 'ai-governance') {
          setCurrentPage('legal');
          setDetailId('governance');
        } else if (['home', 'products', 'solutions', 'ai', 'about', 'blog', 'contact', 'legal', 'faq', 'case-studies'].includes(page)) {
          setCurrentPage(page);
          setDetailId(parts[1]);
        } else {
          setCurrentPage('notFound');
        }
      } else {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page: PageId, newDetailId?: string) => {
    setCurrentPage(page);
    setDetailId(newDetailId);
    if (newDetailId) {
      window.location.hash = `${page}/${newDetailId}`;
    } else {
      window.location.hash = page;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030712] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header */}
      <Header
        currentPage={currentPage === 'notFound' ? 'home' : currentPage}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDemo={() => setIsDemoOpen(true)}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage onNavigate={handleNavigate} onOpenDemo={() => setIsDemoOpen(true)} />
        )}
        {currentPage === 'products' && (
          <ProductsPage
            initialProductId={detailId}
            onOpenDemo={() => setIsDemoOpen(true)}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'solutions' && (
          <SolutionsPage
            initialSolutionId={detailId}
            onOpenDemo={() => setIsDemoOpen(true)}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'ai' && (
          <AiPage onOpenDemo={() => setIsDemoOpen(true)} onNavigate={handleNavigate} />
        )}
        {currentPage === 'about' && (
          <AboutPage onOpenDemo={() => setIsDemoOpen(true)} onNavigate={handleNavigate} />
        )}
        {currentPage === 'blog' && (
          <BlogPage initialArticleId={detailId} onNavigate={handleNavigate} />
        )}
        {currentPage === 'contact' && (
          <ContactPage onNavigate={handleNavigate} />
        )}
        {currentPage === 'legal' && (
          <LegalPage initialTab={detailId} onNavigate={handleNavigate} />
        )}
        {currentPage === 'faq' && (
          <FaqPage onNavigate={handleNavigate} onOpenDemo={() => setIsDemoOpen(true)} />
        )}
        {currentPage === 'case-studies' && (
          <CaseStudiesPage onNavigate={handleNavigate} onOpenDemo={() => setIsDemoOpen(true)} />
        )}
        {currentPage === 'notFound' && (
          <NotFoundPage onNavigate={handleNavigate} onOpenSearch={() => setIsSearchOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} onOpenDemo={() => setIsDemoOpen(true)} />

      {/* Global Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleNavigate}
      />
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}
