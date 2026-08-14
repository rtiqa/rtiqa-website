import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { PlatformPage } from '../types';
import {
  BookOpen,
  ClipboardCheck,
  Award,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  FileText,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardPageProps {
  onNavigate: (page: PlatformPage) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await platformApi.getDashboardStats();
        setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Student Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900/80 to-slate-950/80 border border-amber-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Badge variant="amber">بوابة الطالب &bull; Student Space</Badge>
          <h2 className="text-xl sm:text-2xl font-black text-white">لوحة متابعة التعلم والواجبات اليومية</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            تابع دروسك، سلّم واجباتك المدرسية في موعدها، واطلع على تقييمات المعلمين ودرجاتك.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            مرشد رتقاء الذكي (AI)
          </button>
          <button
            onClick={() => onNavigate('lessons')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            استعراض الدروس
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-bold text-xs transition flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            تسليم الواجبات
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="المواد المسجل بها"
          value={stats?.enrolledCoursesCount || 0}
          subtitle="في شعبتك الدراسية الحالية"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="واجبات بانتظار التسليم"
          value={stats?.pendingAssignmentsCount || 0}
          subtitle="تكليفات نشطة"
          icon={Clock}
          color={stats?.pendingAssignmentsCount > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="الواجبات المكتملة"
          value={stats?.completedAssignmentsCount || 0}
          subtitle="تم تسليمها بنجاح"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="المعدل التراكمي للتقييمات"
          value={`${stats?.gpaPercent || 95}%`}
          subtitle="أداء أكاديمي ممتاز"
          icon={Award}
          color="purple"
          trend="ممتاز"
        />
      </div>

      {/* Grid: Upcoming Assignments + Enrolled Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Assignments */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-400" />
              الواجبات القادمة
            </h3>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.upcomingAssignments && stats.upcomingAssignments.length > 0 ? (
              stats.upcomingAssignments.map((asg: any) => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-200 block">{asg.title}</span>
                    <span className="text-[11px] text-slate-400">الدرجة: {asg.maxScore} نقطة</span>
                  </div>
                  <button
                    onClick={() => onNavigate('assignments')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs hover:bg-amber-500/30 transition"
                  >
                    تسليم
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-400">لا توجد واجبات متأخرة أو معلقة!</p>
              </div>
            )}
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              المقررات والمناهج المسجلة
            </h3>
            <button
              onClick={() => onNavigate('courses')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              استعراض المناهج
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats?.myCourses?.map((course: any) => (
              <div
                key={course.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="emerald" size="sm">
                    {course.subjectName || 'مادة دراسية'}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{course.teacherName}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-200">{course.title}</h4>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onNavigate('lessons')}
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <FileText className="w-3 h-3" />
                    عرض الدروس
                  </button>
                  <button
                    onClick={() => onNavigate('gradebook')}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
                  >
                    <Award className="w-3 h-3" />
                    الدرجات
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
