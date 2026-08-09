import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BlogPost, PageId } from '../types';
import { blogPostsData } from '../data/translations';
import { Search, Sparkles, Clock, User, ArrowRight, X, FileText, Tag } from 'lucide-react';

interface BlogPageProps {
  initialArticleId?: string;
  onNavigate: (page: PageId) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({ initialArticleId, onNavigate }) => {
  const { isRtl, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (initialArticleId) {
      const found = blogPostsData.find((b) => b.id === initialArticleId || b.slug === initialArticleId);
      if (found) setActivePost(found);
    }
  }, [initialArticleId]);

  const categories = ['All', 'AI & Architecture', 'Personalized Learning', 'Security & Cloud'];

  const filteredPosts = blogPostsData.filter((post) => {
    const matchesCat = selectedCategory === 'All' || post.categoryEn === selectedCategory;
    const matchesSearch = (isRtl ? post.titleAr + post.excerptAr : post.titleEn + post.excerptEn)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="pt-28 sm:pt-36 pb-24 space-y-16">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-emerald-500/20">
          <FileText className="w-4 h-4" />
          <span>Rtiqa Insights & Research</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mb-6">
          {isRtl ? 'أفكار وأبحاث مستقبل التعليم' : 'Global EdTech & AI Insights'}
        </h1>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          {isRtl
            ? 'مقالات تحليليّة حول استخدام الذكاء الاصطناعي، التحول الرقمي للمدارس، والسيادة الرقمية في المنظومات التعليمية.'
            : 'Exploring the frontier of artificial intelligence, sovereign cloud architecture, and pedagogical science in education.'}
        </p>

        {/* Search & Filters */}
        <div className="max-w-xl mx-auto mt-8 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRtl ? 'ابحث في المقالات والأبحاث...' : 'Search articles and insights...'}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 text-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              onClick={() => setActivePost(post)}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 hover:-translate-y-1 cursor-pointer group flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="relative h-48 rounded-2xl overflow-hidden mb-5 bg-slate-950">
                  <img
                    src={post.image}
                    alt={post.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border border-slate-800">
                    {isRtl ? post.categoryAr : post.categoryEn}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isRtl ? post.readTimeAr : post.readTimeEn}</span>
                  </span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>

                <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-emerald-400 transition-colors leading-snug">
                  {isRtl ? post.titleAr : post.titleEn}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                  {isRtl ? post.excerptAr : post.excerptEn}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{post.author}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>{t.readArticle}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Article Reader Reader Modal */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 my-8 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActivePost(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                {isRtl ? activePost.categoryAr : activePost.categoryEn}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 leading-tight">
                {isRtl ? activePost.titleAr : activePost.titleEn}
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>By {activePost.author} ({isRtl ? activePost.authorRoleAr : activePost.authorRoleEn})</span>
                <span>•</span>
                <span>{activePost.date}</span>
              </div>
            </div>

            <div className="h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-950">
              <img src={activePost.image} alt="Header" className="w-full h-full object-cover" />
            </div>

            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line space-y-4">
              {isRtl ? activePost.contentAr : activePost.contentEn}
            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-2">
              {activePost.tags.map((tag) => (
                <span key={tag} className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
