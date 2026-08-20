import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { Course, Assessment, AssessmentCategory, GradebookMatrix, StudentAcademicPerformanceSummary } from '../types';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import {
  Award,
  Download,
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  UserCheck,
  TrendingUp,
  X,
} from 'lucide-react';

const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  HOMEWORK: 'واجب منزلي',
  QUIZ: 'اختبار قصير',
  EXAM: 'امتحان رئيسي',
  PROJECT: 'مشروع / بحث',
  CLASSWORK: 'مشاركة صفية',
  MIDTERM: 'امتحان نصفي',
  FINAL: 'امتحان نهائي',
};

const CATEGORY_COLORS: Record<AssessmentCategory, 'blue' | 'amber' | 'purple' | 'emerald' | 'rose'> = {
  HOMEWORK: 'blue',
  QUIZ: 'amber',
  EXAM: 'rose',
  PROJECT: 'purple',
  CLASSWORK: 'emerald',
  MIDTERM: 'amber',
  FINAL: 'rose',
};

export const GradebookPage: React.FC = () => {
  const { user } = usePlatformAuth();
  const isStudentOrParent = user?.role === 'STUDENT' || user?.role === 'PARENT';

  // Teacher / Admin State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [gradebookData, setGradebookData] = useState<GradebookMatrix | any>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Assessment Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<AssessmentCategory>('QUIZ');
  const [newMaxScore, setNewMaxScore] = useState<number>(20);
  const [newWeight, setNewWeight] = useState<number>(10);
  const [newDueDate, setNewDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

  // Grade Entry Modal State
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [assessmentRoster, setAssessmentRoster] = useState<any[]>([]);
  const [inputScores, setInputScores] = useState<Record<string, { score: number; feedback: string }>>({});
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Student Performance State
  const [studentPerformance, setStudentPerformance] = useState<StudentAcademicPerformanceSummary | null>(null);

  const loadTeacherData = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.getCourses();
      setCourses(res.data);
      if (res.data.length > 0) {
        const initialCourseId = res.data[0].id;
        setSelectedCourseId(initialCourseId);
        await Promise.all([loadGradebook(initialCourseId), loadAssessments(initialCourseId)]);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.getMyGrades();
      setStudentPerformance(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGradebook = async (courseId: string) => {
    try {
      const res = await platformApi.getCourseGradebook(courseId);
      setGradebookData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAssessments = async (courseId: string) => {
    try {
      const res = await platformApi.getAssessments({ courseId });
      setAssessments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isStudentOrParent) {
      loadStudentData();
    } else {
      loadTeacherData();
    }
  }, [user?.role]);

  const handleCourseChange = async (id: string) => {
    setSelectedCourseId(id);
    setIsLoading(true);
    await Promise.all([loadGradebook(id), loadAssessments(id)]);
  };

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !newTitle.trim()) return;
    setIsSubmittingAssessment(true);
    try {
      await platformApi.createAssessment({
        courseId: selectedCourseId,
        title: newTitle.trim(),
        category: newCategory,
        maxScore: Number(newMaxScore),
        weightPercentage: Number(newWeight),
        dueDate: newDueDate,
        status: 'PUBLISHED',
      });
      setShowCreateModal(false);
      setNewTitle('');
      await Promise.all([loadGradebook(selectedCourseId), loadAssessments(selectedCourseId)]);
    } catch (e: any) {
      alert(e.message || 'فشل إضافة التقييم');
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handleOpenGradingModal = async (assessment: Assessment) => {
    setActiveAssessment(assessment);
    setIsLoadingRoster(true);
    setSaveSuccessMsg('');
    try {
      const res = await platformApi.getAssessmentGrades(assessment.id);
      setAssessmentRoster(res.data.roster);
      const initialMap: Record<string, { score: number; feedback: string }> = {};
      res.data.roster.forEach((item) => {
        initialMap[item.studentId] = {
          score: item.score !== undefined ? item.score : assessment.maxScore,
          feedback: item.feedback || '',
        };
      });
      setInputScores(initialMap);
    } catch (e: any) {
      alert(e.message || 'فشل جلب قائمة الطلاب للتقييم');
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const handleSaveGradesBatch = async () => {
    if (!activeAssessment) return;
    setIsSavingGrades(true);
    setSaveSuccessMsg('');
    try {
      const payload = Object.entries(inputScores).map(([studentId, data]: [string, { score: number; feedback: string }]) => ({
        studentId,
        score: Number(data.score),
        feedback: data.feedback,
      }));
      await platformApi.recordAssessmentGradesBatch(activeAssessment.id, payload);
      setSaveSuccessMsg('تم حفظ الدرجات بنجاح!');
      setTimeout(() => {
        setActiveAssessment(null);
        if (selectedCourseId) {
          loadGradebook(selectedCourseId);
          loadAssessments(selectedCourseId);
        }
      }, 1000);
    } catch (e: any) {
      alert(e.message || 'فشل حفظ الدرجات');
    } finally {
      setIsSavingGrades(false);
    }
  };

  const handleExportCsv = async () => {
    if (!selectedCourseId) return;
    try {
      const res = await platformApi.exportGradebookCsv(selectedCourseId);
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.fileName || `gradebook_${selectedCourseId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(e.message || 'فشل تصدير كشف الدرجات');
    }
  };

  if (isStudentOrParent) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/50 via-slate-900/80 to-slate-950/80 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="purple">السجل الأكاديمي المعتمد &bull; Official Academic Transcript</Badge>
            <h2 className="text-xl sm:text-2xl font-black text-white">كشف الدرجات والتقييمات الأكاديمية</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              تقرير تفصيلي لجميع المقررات، التقييمات، الاختبارات والواجبات المنجزة.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/90 border border-purple-500/30 p-4 rounded-2xl">
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">المعدل العام</span>
              <span className="text-xl font-black text-purple-300">
                {studentPerformance?.overallGpaPercent || 0}%
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">التقدير العام</span>
              <span className="text-xl font-black text-emerald-400">
                {studentPerformance?.letterGrade || 'A+'}
              </span>
            </div>
          </div>
        </div>

        {/* Courses Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentPerformance?.courses?.map((c) => (
            <div key={c.courseId} className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{c.courseTitle}</h3>
                  <p className="text-xs text-slate-400">{c.teacherName || 'معلم المادة'}</p>
                </div>
                <Badge variant={c.percentage >= 90 ? 'emerald' : c.percentage >= 75 ? 'blue' : 'amber'}>
                  {c.percentage}% ({c.letterGrade})
                </Badge>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">مجموع الدرجات:</span>
                <span className="font-mono font-bold text-white">
                  {c.earnedPoints} / {c.maxPossiblePoints}
                </span>
              </div>

              {c.assessments && c.assessments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 block">تفاصيل التقييمات:</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {c.assessments.map((ass) => (
                      <div
                        key={ass.assessmentId}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-200 block">{ass.title}</span>
                          <span className="text-[10px] text-slate-400">{CATEGORY_LABELS[ass.category] || ass.category}</span>
                        </div>
                        <div className="text-end">
                          {ass.status === 'GRADED' ? (
                            <span className="font-mono font-bold text-emerald-400">
                              {ass.score} / {ass.maxScore}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-400">قيد الرصد</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Teacher / Admin View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">سجل الدرجات وكشوف التقييم</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة الاختبارات والواجبات، رصد الدرجات المباشر، وتصدير كشوف التقييم المعتمدة.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.classroomName})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة تقييم / اختبار
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!gradebookData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Assessments Bar */}
      {assessments.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              التقييمات والاختبارات الحالية ({assessments.length})
            </h3>
            <span className="text-[11px] text-slate-400">انقر على التقييم لرصد درجات الطلاب</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {assessments.map((ass) => (
              <div
                key={ass.id}
                onClick={() => handleOpenGradingModal(ass)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={CATEGORY_COLORS[ass.category] || 'blue'} size="sm">
                    {CATEGORY_LABELS[ass.category] || ass.category}
                  </Badge>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">{ass.maxScore} درجة</span>
                </div>
                <h4 className="font-bold text-xs text-slate-200 group-hover:text-emerald-300 transition truncate">
                  {ass.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>الوزن: {ass.weightPercentage || 0}%</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Edit3 className="w-3 h-3" />
                    رصد الدرجات
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grade Matrix Table */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-slate-200">
              {gradebookData?.course?.title || 'مصفوفة الدرجات'} &bull; شعبة {gradebookData?.course?.classroomName || 'الصف'}
            </span>
          </div>
          <Badge variant="emerald" size="sm">
            متوسط الشعبة: {gradebookData?.classAveragePercentage || 0}%
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-300">
            <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-3.5 text-start">اسم الطالب</th>
                <th className="px-4 py-3.5 text-start">الرقم الأكاديمي</th>
                {gradebookData?.assessments?.map((asg: any) => (
                  <th key={asg.id} className="px-4 py-3.5 text-center">
                    <div>{asg.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal">({asg.maxScore} درجة)</div>
                  </th>
                ))}
                <th className="px-6 py-3.5 text-center font-black text-emerald-400">المجموع</th>
                <th className="px-6 py-3.5 text-center font-black text-emerald-400">النسبة</th>
                <th className="px-4 py-3.5 text-center font-black text-purple-400">التقدير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : !gradebookData?.students || gradebookData.students.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-500">
                    لا توجد بيانات طلاب أو تقييمات مسجلة في هذا المقرر
                  </td>
                </tr>
              ) : (
                gradebookData.students.map((row: any) => (
                  <tr key={row.studentId} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-100">{row.studentName}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{row.studentIdNumber || '—'}</td>
                    {gradebookData.assessments?.map((asg: any) => {
                      const scoreObj = row.scores[asg.id];
                      return (
                        <td key={asg.id} className="px-4 py-3.5 text-center font-mono">
                          {scoreObj?.score !== undefined ? (
                            <span className="text-slate-200 font-bold">{scoreObj.score}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-100">
                      {row.totalEarned} / {row.totalMax}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <Badge
                        variant={
                          row.percentage >= 90 ? 'emerald' : row.percentage >= 75 ? 'blue' : 'amber'
                        }
                        size="sm"
                      >
                        {row.percentage}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-purple-300">
                      {row.letterGrade || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                إضافة تقييم / اختبار جديد
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssessment} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">عنوان التقييم</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الاختبار القصير الأول (الوحدة الأولى)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">نوع التقييم</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AssessmentCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                      <option key={cat} value={cat}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">الدرجة العظمى</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={newMaxScore}
                    onChange={(e) => setNewMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">وزن التقييم (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssessment}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
                >
                  {isSubmittingAssessment ? 'جاري الحفظ...' : 'حفظ التقييم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Grading Modal */}
      {activeAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="w-full max-w-2xl p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  رصد درجات: {activeAssessment.title}
                </h3>
                <span className="text-xs text-slate-400">
                  الدرجة العظمى: {activeAssessment.maxScore} نقطة &bull; النوع: {CATEGORY_LABELS[activeAssessment.category]}
                </span>
              </div>
              <button onClick={() => setActiveAssessment(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {saveSuccessMsg}
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoadingRoster ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : (
                assessmentRoster.map((st) => (
                  <div
                    key={st.studentId}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block">{st.studentName}</span>
                      <span className="text-[11px] font-mono text-slate-400">{st.studentIdNumber || 'رقم أكاديمي —'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">الدرجة:</span>
                        <input
                          type="number"
                          min={0}
                          max={activeAssessment.maxScore}
                          value={inputScores[st.studentId]?.score ?? activeAssessment.maxScore}
                          onChange={(e) =>
                            setInputScores((prev) => ({
                              ...prev,
                              [st.studentId]: {
                                ...prev[st.studentId],
                                score: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-slate-500 font-mono">/ {activeAssessment.maxScore}</span>
                      </div>

                      <input
                        type="text"
                        placeholder="ملاحظات المعلم (اختياري)..."
                        value={inputScores[st.studentId]?.feedback || ''}
                        onChange={(e) =>
                          setInputScores((prev) => ({
                            ...prev,
                            [st.studentId]: {
                              ...prev[st.studentId],
                              feedback: e.target.value,
                            },
                          }))
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none w-44"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">عدد الطلاب: {assessmentRoster.length}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveAssessment(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition"
                >
                  إغلاق
                </button>
                <button
                  onClick={handleSaveGradesBatch}
                  disabled={isSavingGrades}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  {isSavingGrades ? 'جاري الحفظ...' : 'اعتماد وحفظ الدرجات'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

