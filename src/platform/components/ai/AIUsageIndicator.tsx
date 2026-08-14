import React from 'react';
import { Zap, DollarSign, Activity, HardDrive } from 'lucide-react';
import { AIUsageSummary } from '../../types';

interface AIUsageIndicatorProps {
  summary: AIUsageSummary | null;
  loading?: boolean;
}

export const AIUsageIndicator: React.FC<AIUsageIndicatorProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
        <div className="h-2 bg-slate-200 rounded w-full" />
      </div>
    );
  }

  if (!summary) return null;

  const usedPercent = summary.usedQuotaPercentage || 0;
  const isHigh = usedPercent > 80;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-sm border border-slate-700/60">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">رصيد الذكاء الاصطناعي الشهري</h4>
            <p className="text-[10px] text-slate-400">باقة المؤسسة الذكية (Rtiqa AI Quota)</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {usedPercent}% مستخدم
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isHigh
              ? 'bg-amber-500'
              : 'bg-gradient-to-r from-emerald-500 to-teal-400'
          }`}
          style={{ width: `${Math.max(4, usedPercent)}%` }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50 text-center">
        <div className="p-1.5 rounded-lg bg-white/5">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <HardDrive className="w-3 h-3 text-teal-400" />
            الرموز (Tokens)
          </div>
          <div className="text-xs font-bold font-mono text-slate-100 mt-0.5">
            {(summary.totalTokens || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-white/5">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-indigo-400" />
            الطلبات
          </div>
          <div className="text-xs font-bold font-mono text-slate-100 mt-0.5">
            {summary.requestsCount || 0}
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-white/5">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            التكلفة التقديرية
          </div>
          <div className="text-xs font-bold font-mono text-emerald-300 mt-0.5">
            ${(summary.totalCostUsd || 0).toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
};
