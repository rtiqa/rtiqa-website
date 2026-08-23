import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  UserCheck,
  Brain,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { platformApi } from '../services/api';
import type { AcademicAnalyticsSummary, PlatformPage } from '../types';
import { Badge } from './Badge';

interface AcademicAnalyticsPanelProps {
  onNavigate?: (page: PlatformPage) => void;
}

export const AcademicAnalyticsPanel: React.FC<AcademicAnalyticsPanelProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<AcademicAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await platformApi.getAcademicAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'تعذر تحميل التحليلات الأكاديمية');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">جاري تحليل الأداء الأكاديمي واكتشاف مؤشرات الدعم المبكر...</p>
      </div>
    );
  }

  if (error || !analytics) {
    return null;
  }

  const { overallSummary, atRiskStudents, coursePerformance, gradeDistribution } = analytics;
  const totalGraded = overallSummary.totalGradedSubmissions;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              التحليلات الأكاديمية ونظام التدخل المبكر (Early Warning & Intervention)
            </h3>
            <p className="text-xs text-slate-400">
              تحليل فوري لمستويات التحصيل وتحديد الطلاب المستحقين لخطط التعزيز
            </p>
          </div>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>استشارة مستشار الذكاء الأكاديمي</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Score Card */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>المعدل العام للتحصيل</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{overallSummary.schoolAverageScore}%</span>
            <span className="text-xs text-emerald-400 font-bold">
              {overallSummary.schoolAverageScore >= 80 ? 'أداء مرتفع' : 'أداء متوسط'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, overallSummary.schoolAverageScore)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-500 block">
            بناءً على {totalGraded} واجباً واختباراً تم تقييمها
          </span>
        </div>

        {/* Grade Distribution Breakdown */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>توزيع التقديرات المدرسية</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="block font-black text-emerald-400">{gradeDistribution.excellent}</span>
              <span className="text-[10px] text-slate-400">ممتاز</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="block font-black text-blue-400">{gradeDistribution.veryGood}</span>
              <span className="text-[10px] text-slate-400">جيد جداً</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="block font-black text-amber-400">{gradeDistribution.good}</span>
              <span className="text-[10px] text-slate-400">جيد</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="block font-black text-rose-400">{gradeDistribution.needsSupport}</span>
              <span className="text-[10px] text-slate-400">دعم</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 block text-center">
            {overallSummary.totalStudentsAtRisk > 0
              ? `${overallSummary.totalStudentsAtRisk} طلاب بحاجة إلى متابعة فردية`
              : 'جميع الطلاب يحققون المعايير المطلوبة'}
          </span>
        </div>

        {/* Early Warning Status */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>مؤشر الأمان الأكاديمي</span>
            <ShieldAlert
              className={`w-4 h-4 ${
                overallSummary.totalStudentsAtRisk > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{overallSummary.totalStudentsAtRisk}</span>
            <span className="text-xs text-slate-300">حالات مستحقة للمساندة</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {overallSummary.totalStudentsAtRisk > 0
              ? 'تم رصد حالات انخفاض في الدرجات أو الغياب المتكرر تتطلب تفعيل خطط التعزيز المدرسية.'
              : 'المؤشرات مستقرة، ولا توجد مؤشرات حرجة تستدعي تدخلاً طارئاً.'}
          </p>
        </div>
      </div>

      {/* Bento Two-Column: At-Risk Students & Course Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* At Risk Students List (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-slate-200">الطلاب المستحقون للتدخل والدعم الأكاديمي</h4>
            </div>
            {atRiskStudents.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                {atRiskStudents.length} حالة
              </span>
            )}
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-60" />
              <p className="text-xs font-bold text-slate-300">لا يوجد طلاب تحت دائرة الخطر الأكاديمي</p>
              <p className="text-[11px] text-slate-500">كافة النتائج ومعدلات الحضور ضمن النطاق الطبيعي</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {atRiskStudents.map((st) => (
                <div
                  key={st.studentId}
                  className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-100 block">{st.studentName}</span>
                      <span className="text-[11px] text-slate-400">
                        معدل التحصيل: <strong className="text-rose-400">{st.averageScore}%</strong> &bull; الحضور:{' '}
                        <strong className={st.attendanceRate < 80 ? 'text-amber-400' : 'text-slate-300'}>
                          {st.attendanceRate}%
                        </strong>
                      </span>
                    </div>

                    <Badge variant={st.riskLevel === 'HIGH' ? 'rose' : 'amber'} size="sm">
                      {st.riskLevel === 'HIGH' ? 'خطورة مرتفعة' : 'متابعة متوسطة'}
                    </Badge>
                  </div>

                  {/* Reasons list */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {st.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400"
                      >
                        &bull; {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Performance (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-slate-200">أداء المقررات الدراسية</h4>
            </div>
            <span className="text-xs text-slate-400">{coursePerformance.length} مقررات</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {coursePerformance.map((c) => (
              <div
                key={c.courseId}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-200 block">{c.courseTitle}</span>
                  <span className="text-[11px] text-slate-400">{c.gradedSubmissions} واجبات مصححة</span>
                </div>
                <div className="text-end">
                  <span
                    className={`font-black text-sm block ${
                      c.averageScore >= 80
                        ? 'text-emerald-400'
                        : c.averageScore >= 65
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {c.averageScore}%
                  </span>
                  <span className="text-[10px] text-slate-500">متوسط الدرجات</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
