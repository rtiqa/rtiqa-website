import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ProductItem, PageId } from '../types';
import { productsData } from '../data/translations';
import { DynamicIcon } from '../components/DynamicIcon';
import { Sparkles, ArrowRight, CheckCircle2, Layers, X, Shield, Cpu, ExternalLink } from 'lucide-react';

interface ProductsPageProps {
  initialProductId?: string;
  onOpenDemo: () => void;
  onNavigate: (page: PageId, detailId?: string) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  initialProductId,
  onOpenDemo,
  onNavigate,
}) => {
  const { isRtl, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    if (initialProductId) {
      const found = productsData.find((p) => p.id === initialProductId);
      if (found) setActiveProduct(found);
    }
  }, [initialProductId]);

  const categories = ['All', 'Infrastructure', 'Operations', 'Learning', 'Artificial Intelligence', 'Empowerment', 'Intelligence', 'Extensibility'];

  const filteredProducts = selectedCategory === 'All'
    ? productsData
    : productsData.filter((p) => p.category === selectedCategory);

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-16">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <Layers className="w-4 h-4" />
          <span>Rtiqa Product Suite</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'منظومة منتجات رتقاء المتكاملة' : 'The Rtiqa Integrated Ecosystem'}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
          {isRtl
            ? 'منظومة متناغمة من البرمجيات والأدوات الذكية المصممة لخدمة كافة جوانب العملية التعليمية تحت مظلة نظام تشغيل واحد.'
            : 'Explore our comprehensive portfolio of interconnected products powering next-generation school operations, learning experiences, and institutional intelligence.'}
        </p>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mt-8 pt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => setActiveProduct(prod)}
              className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              {prod.statusEn && (
                <span className={`absolute top-5 right-5 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                  prod.statusEn.includes('Coming Soon') || prod.statusEn.includes('Roadmap')
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {isRtl ? prod.statusAr : prod.statusEn}
                </span>
              )}

              <div>
                <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <DynamicIcon name={prod.icon} size={28} />
                </div>

                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                  {prod.category}
                </span>

                <h3 className="text-2xl font-bold text-slate-100 mt-1 mb-2 group-hover:text-emerald-400 transition-colors">
                  {isRtl ? prod.nameAr : prod.nameEn}
                </h3>

                <p className="text-xs font-semibold text-emerald-400/90 mb-4">
                  {isRtl ? prod.taglineAr : prod.taglineEn}
                </p>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {isRtl ? prod.descriptionAr : prod.descriptionEn}
                </p>

                <div className="space-y-2 mb-6">
                  {(isRtl ? prod.featuresAr : prod.featuresEn).slice(0, 3).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="line-clamp-1">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                <span>{isRtl ? 'عرض تفاصيل المنتج' : 'Inspect Product Architecture'}</span>
                <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Selected Product Detail Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 glow-emerald my-8">
            <button
              onClick={() => setActiveProduct(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <DynamicIcon name={activeProduct.icon} size={30} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  {activeProduct.category}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-100">
                  {isRtl ? activeProduct.nameAr : activeProduct.nameEn}
                </h3>
                <p className="text-xs text-slate-400">
                  {isRtl ? activeProduct.taglineAr : activeProduct.taglineEn}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              {isRtl ? activeProduct.descriptionAr : activeProduct.descriptionEn}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {isRtl ? 'أبرز المزايا والقدرات التشغيلية' : 'Key Capabilities & Technical Features'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(isRtl ? activeProduct.featuresAr : activeProduct.featuresEn).map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => {
                  setActiveProduct(null);
                  onOpenDemo();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRtl ? 'طلب تجربة هذا المنتج' : 'Request Demo for this Product'}</span>
              </button>

              <button
                onClick={() => setActiveProduct(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium transition"
              >
                {isRtl ? 'إغلاق' : 'Close Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
