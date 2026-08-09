import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, X, ArrowRight, Sparkles, Box, FileText, Layers } from 'lucide-react';
import { productsData, solutionsData, blogPostsData } from '../data/translations';
import { PageId } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId, detailId?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { isRtl, t } = useLanguage();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProducts = productsData.filter((p) =>
    (isRtl ? p.nameAr + p.descriptionAr : p.nameEn + p.descriptionEn)
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const filteredSolutions = solutionsData.filter((s) =>
    (isRtl ? s.targetAr + s.titleAr : s.targetEn + s.titleEn)
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const filteredBlogs = blogPostsData.filter((b) =>
    (isRtl ? b.titleAr + b.excerptAr : b.titleEn + b.excerptEn)
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glow-emerald">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <Sparkles className="w-8 h-8 mx-auto text-emerald-500/50 mb-2 animate-pulse" />
              <p>{isRtl ? 'اكتب للبحث في كافة أدوات رتقاء ومنتجاتها وحلولها الذكية' : 'Start typing to search Rtiqa products, solutions, and AI modules'}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Rtiqa AI', 'Rtiqa School', 'LMS', 'Teachers', 'Analytics'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 text-xs rounded-full bg-slate-800/80 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 border border-slate-700/50 transition"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Products */}
              {filteredProducts.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" />
                    {isRtl ? 'المنتجات والأنظمة' : 'Products & Systems'}
                  </h4>
                  <div className="space-y-1">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onNavigate('products', p.id);
                          onClose();
                        }}
                        className="w-full text-start p-2.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-100 group-hover:text-emerald-400 transition">
                            {isRtl ? p.nameAr : p.nameEn}
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-1">
                            {isRtl ? p.taglineAr : p.taglineEn}
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Solutions */}
              {filteredSolutions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    {isRtl ? 'الحلول الموجهة' : 'Targeted Solutions'}
                  </h4>
                  <div className="space-y-1">
                    {filteredSolutions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onNavigate('solutions', s.id);
                          onClose();
                        }}
                        className="w-full text-start p-2.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-100 group-hover:text-indigo-400 transition">
                            {isRtl ? s.targetAr : s.targetEn}
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-1">
                            {isRtl ? s.titleAr : s.titleEn}
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Blog */}
              {filteredBlogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {isRtl ? 'المقالات والأفكار' : 'Insights & Articles'}
                  </h4>
                  <div className="space-y-1">
                    {filteredBlogs.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          onNavigate('blog', b.id);
                          onClose();
                        }}
                        className="w-full text-start p-2.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-100 group-hover:text-slate-300 transition">
                            {isRtl ? b.titleAr : b.titleEn}
                          </div>
                          <div className="text-xs text-slate-400 line-clamp-1">
                            {isRtl ? b.excerptAr : b.excerptEn}
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-slate-300 transition ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 && filteredSolutions.length === 0 && filteredBlogs.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {isRtl ? 'لم نجد نتائج تطابق بحثك.' : 'No matching results found.'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Keyboard Hint */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>{isRtl ? 'اضغط ESC للإغلاق' : 'Press ESC to close'}</span>
          <span className="font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
            ⌘K
          </span>
        </div>
      </div>
    </div>
  );
};
