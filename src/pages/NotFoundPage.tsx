import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PageId } from '../types';
import { Compass, Home, Search, ArrowRight } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (page: PageId) => void;
  onOpenSearch: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate, onOpenSearch }) => {
  const { isRtl } = useLanguage();

  return (
    <div className="pt-36 pb-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
      <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl glow-emerald">
        <Compass className="w-10 h-10 animate-spin-slow" />
      </div>

      <div className="space-y-3">
        <span className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider">
          Error 404 • Page Not Found
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-100">
          {isRtl ? 'الصفحة التي تطلبها غير موجودة' : 'Requested Page Not Found'}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          {isRtl
            ? 'يبدو أن الرابط الذي حاولت الوصول إليه قد تم نقله أو غير متاح في منصة رتقاء.'
            : 'The resource or section you are trying to access does not exist or has been relocated.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={() => onNavigate('home')}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Home className="w-4 h-4" />
          <span>{isRtl ? 'العودة للرئيسية' : 'Return to Home'}</span>
        </button>

        <button
          onClick={onOpenSearch}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm transition flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4 text-emerald-400" />
          <span>{isRtl ? 'البحث في الموقع' : 'Search Platform'}</span>
        </button>
      </div>
    </div>
  );
};
