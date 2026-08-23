import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { AcademicAnalyticsPanel } from '../components/AcademicAnalyticsPanel';
import { PlatformPage } from '../types';
import {
  BookOpen,
  Users,
  ClipboardCheck,
  Award,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Plus,
  Sparkles,
} from 'lucide-react';

interface TeacherDashboardPageProps {
  onNavigate: (page: PlatformPage) => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({ onNavigate }) => {
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
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Teacher Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-950/80 border border-blue-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Badge variant="blue">بوابة المعلم &bull; Teacher Portal</Badge>
          <h2 className="text-xl sm:text-2xl font-black text-white">مرحباً بك في مركز إدارة الفصول والتقييم</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            يمكنك متابعة الشعب المسندة إليك، رصد الحضور والغياب، وتصحيح الواجبات ورصد الدرجات.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            المساعد الذكي (AI)
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            رصد حضور اليوم
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-blue-500/30 hover:border-blue-400 text-blue-300 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إنشاء واجب جديد
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="المقررات المسندة إليك"
          value={stats?.activeCoursesCount || 0}
          subtitle="فصول دراسية نشطة"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="إجمالي الطلاب المسندين"
          value={stats?.totalEnrolledStudents || 0}
          subtitle="طلاب في شعبك الدراسية"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="الواجبات والتكليفات"
          value={stats?.totalAssignmentsCount || 0}
          subtitle="تكليفات منشورة"
          icon={ClipboardCheck}
          color="purple"
        />
        <StatCard
          title="تسليمات تتطلب التصحيح"
          value={stats?.pendingGradingCount || 0}
          subtitle="بانتظار رصد الدرجة"
          icon={Clock}
          color={stats?.pendingGradingCount > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Academic Analytics & Student Early Warning */}
      <AcademicAnalyticsPanel onNavigate={onNavigate} />

      {/* Active Courses List */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            المقررات والشعب التي تقوم بتدريسها
          </h3>
          <button
            onClick={() => onNavigate('courses')}
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          >
            عرض كافة المقررات
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.myCourses?.map((course: any) => (
            <div
              key={course.id}
              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition group space-y-3"
            >
              <div className="flex items-center justify-between">
                <Badge variant="blue" size="sm">
                  {course.classroomName || '10-A'}
                </Badge>
                <span className="text-[11px] text-slate-400 font-mono">الفصل الأول</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-100 group-hover:text-blue-300 transition">
                  {course.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={() => onNavigate('lessons')}
                  className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <FileText className="w-3.5 h-3.5" />
                  إدارة الدروس
                </button>
                <button
                  onClick={() => onNavigate('gradebook')}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Award className="w-3.5 h-3.5" />
                  سجل الدرجات
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
