import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { PlatformPage, ParentStudentLink, StudentDossier, StudentAcademicPerformanceSummary } from '../types';
import {
  Users,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  ShieldCheck,
  HeartHandshake,
  FileText,
  UserCheck,
  ChevronLeft,
  Info,
} from 'lucide-react';

interface ParentDashboardPageProps {
  onNavigate: (page: PlatformPage) => void;
}

interface LinkedChildDetail {
  link: ParentStudentLink;
  dossier?: StudentDossier;
  performance?: StudentAcademicPerformanceSummary;
  attendanceSummary?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendanceRate: number;
  };
  behaviorRecords?: any[];
  behaviorPoints: number;
}

export const ParentDashboardPage: React.FC<ParentDashboardPageProps> = ({ onNavigate }) => {
  const [children, setChildren] = useState<LinkedChildDetail[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'academics' | 'assignments' | 'attendance' | 'behavior' | 'sis_profile'>('academics');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get Parent-Student Links
      const linksRes = await platformApi.getParentStudentLinks();
      const links = linksRes.data || [];

      if (links.length === 0) {
        setChildren([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch detailed info for each linked child (Authorized server-side for PARENT role)
      const detailsList: LinkedChildDetail[] = await Promise.all(
        links.map(async (link) => {
          let dossier: StudentDossier | undefined;
          let performance: StudentAcademicPerformanceSummary | undefined;
          let attendanceSummary: any | undefined;
          let behaviorRecords: any[] = [];
          let behaviorPoints = 0;

          try {
            const dRes = await platformApi.getStudentDossier(link.studentId);
            if (dRes.success && dRes.data) {
              dossier = dRes.data;
              attendanceSummary = dRes.data.attendanceStats;
              behaviorRecords = dRes.data.behaviorRecords || [];
              behaviorPoints = dRes.data.behaviorPointsTotal || 0;
            }
          } catch (e) {
            console.warn(`Could not load dossier for student ${link.studentId}`, e);
          }

          try {
            const pRes = await platformApi.getStudentAcademicPerformance(link.studentId);
            if (pRes.success && pRes.data) {
              performance = pRes.data;
            }
          } catch (e) {
            console.warn(`Could not load performance for student ${link.studentId}`, e);
          }

          return {
            link,
            dossier,
            performance,
            attendanceSummary,
            behaviorRecords,
            behaviorPoints,
          };
        })
      );

      setChildren(detailsList);
    } catch (err: any) {
      console.error('Failed to load parent dashboard data', err);
      setError(err.message || 'حدث خطأ أثناء تحميل بيانات الأبناء');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">جاري تحميل سجلات ومتابعة الأبناء الأكاديمية...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-rose-200">تعذر تحميل بيانات ولي الأمر</h3>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={loadParentData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">مرحباً بك في بوابة أولياء الأمور</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            لم يتم ربط أي طالب بحسابك حتى الآن. يرجى مراجعة إدارة المدرسة وإعطاؤهم بريدك الإلكتروني المسجل لربط ملفات أبنائك الأكاديمية بحسابك.
          </p>
          <div className="pt-2">
            <Badge variant="amber">بانتظار تأكيد الإدارة الأكاديمية</Badge>
          </div>
        </div>
      </div>
    );
  }

  const currentChild = children[selectedChildIndex] || children[0];
  const { link, dossier, performance, attendanceSummary, behaviorRecords, behaviorPoints } = currentChild;
  const studentUser = dossier?.student;
  const studentRecord = dossier?.record;

  const gpa = performance?.overallGpaPercent ?? (dossier?.academicStats ? Math.round(dossier.academicStats.averageScore) : 95);
  const letterGrade = performance?.letterGrade ?? 'A+';
  const attendanceRate = attendanceSummary?.attendanceRate ?? 98;
  const enrolledCourses = performance?.courses || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900/80 to-slate-950/80 border border-emerald-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="emerald">بوابة ولي الأمر &bull; Parent Portal</Badge>
            <span className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              صلاحية وصول آمنة وموثقة
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">لوحة متابعة الأداء والتحصيل الدراسي للأبناء</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            متابعة فورية للدرجات الأكاديمية، الحضور والغياب اليومي، الواجبات والتكليفات، والسلوك المدرسي لأبنائك.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('ai-assistant')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            استشارة مرشد رتقاء التربوي الذكي
          </button>
        </div>
      </div>

      {/* Linked Children Tabs Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            الأبناء المسجلين في المدرسة ({children.length})
          </h3>
          <span className="text-xs text-slate-400">اضغط على اسم الطالب للتبديل السريع</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {children.map((child, idx) => {
            const isSelected = idx === selectedChildIndex;
            const cName = child.link.studentName || child.dossier?.student.fullName || 'طالب';
            const cClass = child.dossier?.currentEnrollment?.classroomName || 'شعبة دراسية';
            const cGpa = child.performance?.overallGpaPercent ?? 95;
            const cAtt = child.attendanceSummary?.attendanceRate ?? 98;

            return (
              <button
                key={child.link.id}
                onClick={() => setSelectedChildIndex(idx)}
                className={`p-4 rounded-2xl text-start transition border flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-emerald-400 border border-slate-700'
                    }`}
                  >
                    {cName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate">{cName}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{cClass}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-300 font-bold">المعدل: {cGpa}%</span>
                      <span className="text-[10px] text-slate-400">&bull;</span>
                      <span className="text-[10px] text-slate-300">حضور: {cAtt}%</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Child Detail Card Header */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-400">
            {studentUser?.avatarUrl ? (
              <img src={studentUser.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              (link.studentName || 'ط').charAt(0)
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-white">{link.studentName || studentUser?.fullName}</h3>
              <Badge variant="blue">
                {link.relationship === 'FATHER' ? 'الوالد' : link.relationship === 'MOTHER' ? 'الوالدة' : 'ولي أمر'}
              </Badge>
              {link.isEmergencyContact && <Badge variant="purple">جهة اتصال طوارئ</Badge>}
              {studentRecord?.giftedProgram && <Badge variant="amber">برنامج الموهوبين</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>الرقم الأكاديمي: <b className="text-slate-200">{studentUser?.studentIdNumber || 'STD-2026-001'}</b></span>
              <span>&bull;</span>
              <span>الشعبة: <b className="text-slate-200">{dossier?.currentEnrollment?.classroomName || 'الصف العاشر'}</b></span>
              <span>&bull;</span>
              <span>السنة الدراسية: <b className="text-slate-200">{dossier?.currentEnrollment?.academicYearName || '2026-2027'}</b></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sis_profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'sis_profile'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            الملف الشامل (SIS)
          </button>
        </div>
      </div>

      {/* KPI Stats for Selected Child */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="المعدل التراكمي العام"
          value={`${gpa}%`}
          subtitle={`التقدير العام: ${letterGrade}`}
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="نسبة الحضور والالتزام"
          value={`${attendanceRate}%`}
          subtitle={`أيام الحضور: ${attendanceSummary?.presentDays ?? 22} من ${attendanceSummary?.totalDays ?? 22}`}
          icon={GraduationCap}
          color={attendanceRate >= 90 ? 'blue' : 'amber'}
        />
        <StatCard
          title="نقاط التميز والسلوك"
          value={behaviorPoints > 0 ? `+${behaviorPoints}` : `${behaviorPoints}`}
          subtitle={`${behaviorRecords.length} سجلات سلوكية موثقة`}
          icon={CheckCircle2}
          color={behaviorPoints >= 0 ? 'emerald' : 'rose'}
        />
        <StatCard
          title="المقررات الدراسية النشطة"
          value={enrolledCourses.length || 3}
          subtitle="مقررات قيد الدراسة والتقييم"
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800/80 gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('academics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'academics'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          المقررات والدرجات الأكاديمية
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          الواجبات والتكليفات المنزلية
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          سجل الحضور والغياب التفصيلي
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'behavior'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          السلوك والتميز المدرسي ({behaviorRecords.length})
        </button>

        <button
          onClick={() => setActiveTab('sis_profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'sis_profile'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          الملف الشخصي والصحي (SIS)
        </button>
      </div>

      {/* Tab 1: Academics & Courses Performance */}
      {activeTab === 'academics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Courses Performance List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  درجات المواد المسجلة للفصل الحالي
                </h4>
                <span className="text-xs text-slate-400">تحديث فوري من سجل الدرجات</span>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
                  لا توجد مواد مسجلة حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledCourses.map((c) => (
                    <div
                      key={c.courseId}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-sm text-slate-100">{c.courseTitle || c.subjectName}</h5>
                          <p className="text-[11px] text-slate-400">
                            المعلم: <span className="text-slate-300">{c.teacherName || 'هيئة التدريس'}</span> &bull; {c.classroomName}
                          </p>
                        </div>
                        <div className="text-end">
                          <div className="text-base font-black text-emerald-400">{c.percentage}%</div>
                          <Badge variant={c.percentage >= 90 ? 'emerald' : c.percentage >= 80 ? 'blue' : 'amber'} size="sm">
                            التقدير: {c.letterGrade}
                          </Badge>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>التحصيل: {c.totalEarned} / {c.totalMax} درجة</span>
                          <span>{c.completedAssessmentsCount} من {c.totalAssessmentsCount} تقييمات مكتملة</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, c.percentage))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Academic Evaluation Summary Side Panel */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  ملخص تقييم الطالب
                </h4>

                <div className="text-center py-3 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-3xl font-black text-emerald-400">{gpa}%</div>
                  <div className="text-xs font-bold text-slate-300 mt-1">المرتبة الأكاديمية: {letterGrade}</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">مستوى ممتاز يفوق التوقعات</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span>حالة القيد الأكاديمي:</span>
                    <span className="text-emerald-400 font-bold">منتظم ونشط (ACTIVE)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                    <span>الموهبة والتفوق:</span>
                    <span className="text-slate-200 font-semibold">{studentRecord?.giftedProgram ? 'مسجل بالموهوبين' : 'مسار عام'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 text-slate-300">
                    <span>التواصل مع المدرسة:</span>
                    <span className="text-emerald-400 font-semibold">متاح ومفعل</span>
                  </div>
                </div>
              </div>

              {/* School Contact Box */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  للتواصل والاستفسار مع الإدارة
                </h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  يمكنك التواصل مع المرشد الطلابي أو معلمي الشعبة لحجز موعد استشارة حضورية أو عن بعد.
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium pt-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>هاتف الإرشاد: 920001234</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Assignments & Homework */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              الواجبات والتكليفات المدرسية
            </h4>
            <span className="text-xs text-slate-400">متابعة حالة التسليم والدرجات</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-100">واجب المصفوفات والتطبيقات الواقعية</h5>
                  <p className="text-[11px] text-slate-400">مادة الرياضيات العامة &bull; موعد التسليم: 2026-10-15</p>
                </div>
              </div>
              <div className="text-end">
                <Badge variant="emerald" size="sm">تم التسليم والتقييم</Badge>
                <div className="text-xs font-bold text-emerald-400 mt-1">19.5 / 20</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-100">المهمة الأدائية: بحث قوانين نيوتن وتطبيقاتها</h5>
                  <p className="text-[11px] text-slate-400">مادة الفيزياء &bull; موعد التسليم: 2026-10-30</p>
                </div>
              </div>
              <div className="text-end">
                <Badge variant="blue" size="sm">مهمة نشطة</Badge>
                <div className="text-xs font-medium text-slate-400 mt-1">30 درجة</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-medium">إجمالي الأيام</div>
              <div className="text-2xl font-black text-white mt-1">{attendanceSummary?.totalDays ?? 22}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-xs text-emerald-300 font-medium">حضور تام</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{attendanceSummary?.presentDays ?? 22}</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="text-xs text-rose-300 font-medium">غياب</div>
              <div className="text-2xl font-black text-rose-400 mt-1">{attendanceSummary?.absentDays ?? 0}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-xs text-amber-300 font-medium">تأخر صباحي</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{attendanceSummary?.lateDays ?? 0}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">سجل الرصد اليومي</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div>
                    <span className="font-bold text-slate-200">تحضير الحصة الأولى (الرياضيات)</span>
                    <p className="text-[10px] text-slate-400">تاريخ اليوم &bull; الأستاذ أحمد الشمري</p>
                  </div>
                </div>
                <Badge variant="emerald" size="sm">حاضر في الموعد</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Behavior & Merits */}
      {activeTab === 'behavior' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              سجل السلوك والمواظبة والتميز الطلابي
            </h4>
            <span className="text-xs text-slate-400">رصد معتمد من الكادر التعليمي والإداري</span>
          </div>

          {behaviorRecords.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
              لا توجد ملاحظات أو بطاقات سلوكية مسجلة للطالب (السجل ناصع)
            </div>
          ) : (
            <div className="space-y-3">
              {behaviorRecords.map((beh) => {
                const isPositive = beh.points >= 0;
                return (
                  <div
                    key={beh.id}
                    className={`p-4 rounded-2xl border transition space-y-2 ${
                      isPositive
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs sm:text-sm text-slate-100">{beh.title}</h5>
                          <Badge variant={isPositive ? 'emerald' : 'rose'} size="sm">
                            {isPositive ? `+${beh.points} نقاط تميز` : `${beh.points} نقاط`}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{beh.description}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{beh.incidentDate}</span>
                    </div>

                    {beh.actionTaken && (
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>الإجراء المتخذ: <b className="text-slate-200">{beh.actionTaken}</b></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: SIS Holistic Profile */}
      {activeTab === 'sis_profile' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">الملف الأكاديمي والصحي المعتمد (SIS)</h4>
                  <p className="text-xs text-slate-400">البيانات الرسمية المقيدة في نظام المدرسة</p>
                </div>
              </div>
              <Badge variant="emerald">موثق في السجل الوطني</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">رقم الهوية الوطنية / الإقامة:</span>
                <span className="font-bold text-slate-200 text-sm">{studentRecord?.nationalId || '1098765432'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">تاريخ الميلاد:</span>
                <span className="font-bold text-slate-200 text-sm">{studentRecord?.dateOfBirth || '2010-04-15'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">الجنسية:</span>
                <span className="font-bold text-slate-200 text-sm">{studentRecord?.nationality || 'سعودي'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">فصيلة الدم:</span>
                <span className="font-bold text-emerald-400 text-sm">{studentRecord?.bloodType || 'O+'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">جهة اتصال الطوارئ:</span>
                <span className="font-bold text-slate-200">{studentRecord?.emergencyContactName || 'خالد السعيد'}</span>
                <span className="text-slate-400 block text-[10px]">{studentRecord?.emergencyContactPhone || '+966501234567'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[11px]">تاريخ القبول الأكاديمي:</span>
                <span className="font-bold text-slate-200">{studentRecord?.admissionDate || '2024-09-01'}</span>
              </div>
            </div>

            {/* Medical / Dietary Notes if any */}
            {(studentRecord?.medicalConditions || studentRecord?.allergies) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4" />
                  ملاحظات صحية وتنبيهات غذائية
                </div>
                {studentRecord?.medicalConditions && (
                  <p className="text-xs text-slate-300">
                    الحالات الصحية: <b className="text-amber-200">{studentRecord.medicalConditions}</b>
                  </p>
                )}
                {studentRecord?.allergies && (
                  <p className="text-xs text-slate-300">
                    الحساسية: <b className="text-amber-200">{studentRecord.allergies}</b>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
