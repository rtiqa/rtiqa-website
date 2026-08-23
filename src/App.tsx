import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { PageId } from './types';
import { updateSeoMetadata } from './services/seoService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Route-based code splitting for all pages and modals
const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const SolutionsPage = React.lazy(() => import('./pages/SolutionsPage').then(m => ({ default: m.SolutionsPage })));
const AiPage = React.lazy(() => import('./pages/AiPage').then(m => ({ default: m.AiPage })));
const AboutPage = React.lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const BlogPage = React.lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const LegalPage = React.lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })));
const FaqPage = React.lazy(() => import('./pages/FaqPage').then(m => ({ default: m.FaqPage })));
const CaseStudiesPage = React.lazy(() => import('./pages/CaseStudiesPage').then(m => ({ default: m.CaseStudiesPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AppPlatform = React.lazy(() => import('./platform/AppPlatform').then(m => ({ default: m.AppPlatform })));
const SearchModal = React.lazy(() => import('./components/SearchModal').then(m => ({ default: m.SearchModal })));
const DemoModal = React.lazy(() => import('./components/DemoModal').then(m => ({ default: m.DemoModal })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">Loading...</span>
    </div>
  </div>
);

const MainAppContent: React.FC = () => {
  const { isRtl, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState<PageId | 'notFound'>('home');
  const [detailId, setDetailId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Dynamic Title, Meta Description, OG & Canonical Management for SEO
  useEffect(() => {
    const key = detailId && ['security', 'privacy', 'terms', 'ai-governance'].includes(detailId)
      ? detailId
      : currentPage;
    updateSeoMetadata(key, language, detailId);
  }, [currentPage, detailId, language]);

  // Sync path and hash routing on load and upon back/forward navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const rawHash = window.location.hash.replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '');

      // 1. Direct clean path matching for platform (/platform or /app)
      if (rawPath === 'platform' || rawPath === 'app' || rawPath.startsWith('platform/') || rawPath.startsWith('app/')) {
        setCurrentPage('platform');
        setDetailId(undefined);
        return;
      }

      // 2. Hash routing matching (#platform, #app, #products, etc.)
      const routeToken = rawHash || rawPath;
      if (routeToken) {
        const parts = routeToken.split('/');
        const page = parts[0] as PageId;

        // Alias routing for security/privacy/terms/ai-governance
        if (['security', 'privacy', 'terms'].includes(page)) {
          setCurrentPage('legal');
          setDetailId(page);
        } else if (page === 'ai-governance') {
          setCurrentPage('legal');
          setDetailId('governance');
        } else if (page === 'platform' || page === 'app') {
          setCurrentPage('platform');
          setDetailId(undefined);
        } else if (['home', 'products', 'solutions', 'ai', 'about', 'blog', 'contact', 'legal', 'faq', 'case-studies'].includes(page)) {
          setCurrentPage(page);
          setDetailId(parts[1]);
        } else {
          setCurrentPage('notFound');
        }
      } else {
        setCurrentPage('home');
        setDetailId(undefined);
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleNavigate = (page: PageId, newDetailId?: string) => {
    setCurrentPage(page);
    setDetailId(newDetailId);

    if (page === 'platform' || page === 'app') {
      try {
        window.history.pushState(null, '', '/platform');
      } catch {
        window.location.hash = 'platform';
      }
    } else {
      const isCurrentlyOnSubpath = window.location.pathname.startsWith('/platform') || window.location.pathname.startsWith('/app');
      if (isCurrentlyOnSubpath) {
        try {
          window.history.pushState(null, '', '/');
        } catch {
          // Fallback
        }
      }

      if (newDetailId) {
        window.location.hash = `${page}/${newDetailId}`;
      } else if (page === 'home') {
        window.location.hash = '';
      } else {
        window.location.hash = page;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentPage === 'platform' || currentPage === 'app') {
    return (
      <React.Suspense fallback={<PageLoadingFallback />}>
        <AppPlatform onExitPlatform={() => handleNavigate('home')} />
      </React.Suspense>
    );
  }

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
        <React.Suspense fallback={<PageLoadingFallback />}>
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
        </React.Suspense>
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
