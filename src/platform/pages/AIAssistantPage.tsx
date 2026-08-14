import React from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { AIChat } from '../components/ai/AIChat';
import { Sparkles, Bot, Shield, CheckCircle2 } from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const { user, organization } = usePlatformAuth();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-3xl text-white shadow-sm border border-emerald-800/40">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              محرك رتقاء الذكي 2026
            </span>
          </div>

          <h1 className="text-2xl font-black text-white">
            مساعد رتقاء الذكي للتعليم (Rtiqa AI)
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            محرك ذكاء اصطناعي سيادي مصمم للمؤسسات الأكاديمية مع عزل كامل للبيانات، وأدوات متخصصة لمساعدة المعلمين في التحضير والتقييم، وإرشاد الطلاب بالمنهجية السقراطية.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-xs shrink-0">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-white">عزل المؤسسة: نشط</div>
            <div className="text-[11px] text-slate-300">{organization?.name || 'مؤسسة تعليمية'}</div>
          </div>
        </div>
      </div>

      {/* Main Interactive AI Component */}
      <AIChat userRole={user?.role} userName={user?.fullName} />
    </div>
  );
};
