import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { PlatformPage } from '../types';
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Percent,
  Plus,
  Upload,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { CsvImportModal } from '../components/CsvImportModal';

interface AdminDashboardPageProps {
  onNavigate: (page: PlatformPage) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, classRes] = await Promise.all([
        platformApi.getDashboardStats(),
        platformApi.getClassrooms(),
      ]);
      setStats(statsRes.data);
      setClassrooms(classRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900/80 to-slate-950/80 border border-emerald-500/20 backdrop-blur-xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <Badge variant="emerald">لوحة القيادة الإدارية &bull; SIS / LMS Hub</Badge>
          <h2 className="text-xl sm:text-2xl font-black text-white">نظرة عامة على الأداء المدرسي والأكاديمي</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            متابعة إحصائيات الطلاب، المعلمين، الشعب الدراسية، ومعدلات الحضور اليومية.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            استيراد الطلاب (CSV)
          </button>
          <button
            onClick={() => onNavigate('users')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة مستخدم
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="إجمالي الطلاب المسجلين"
          value={stats?.totalStudents || 0}
          subtitle="موزعين على الشعب الدراسية"
          icon={GraduationCap}
          color="emerald"
          trend="+12% هذا العام"
        />
        <StatCard
          title="الكادر التعليمي النشط"
          value={stats?.totalTeachers || 0}
          subtitle="معلمون في مختلف التخصصات"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="المقررات والشعب الدراسية"
          value={`${stats?.totalCourses || 0} / ${stats?.totalClassrooms || 0}`}
          subtitle="مقررات نشطة وشعب مفعلة"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="نسبة الحضور التراكمية"
          value={`${stats?.attendanceRate || 96}%`}
          subtitle="معدل انضباط مرتفع"
          icon={Percent}
          color="amber"
          trend="مستقر"
        />
      </div>

      {/* Quick Action Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Structure Quick Links */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              الهيكل والصفوف الدراسية
            </h3>
            <button
              onClick={() => onNavigate('academic')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {classrooms.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-200 block">{c.name}</span>
                  <span className="text-[11px] text-slate-400">السعة: {c.capacity || 30} طالب</span>
                </div>
                <Badge variant="emerald" size="sm">
                  نشط
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Audit Stream */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              سجل العمليات والأمان الأخير (Audit Log)
            </h3>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              عرض سجل الأمان
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
              stats.recentLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <span className="font-bold text-slate-200 block">{log.action}</span>
                      <span className="text-[11px] text-slate-400">{log.userEmail || 'System'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">لا توجد عمليات مسجلة حديثاً</p>
            )}
          </div>
        </div>
      </div>

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={loadData}
        classrooms={classrooms}
      />
    </div>
  );
};
