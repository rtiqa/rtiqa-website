import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { Assignment, Course, Submission } from '../types';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  ClipboardCheck,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  Upload,
  Award,
  AlertCircle,
  ChevronRight,
  Send,
} from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const { user } = usePlatformAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  // New Assignment State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMaxScore, setNewMaxScore] = useState('20');
  const [newDueDate, setNewDueDate] = useState('2026-10-30T23:59');

  // Student Submission State
  const [subText, setSubText] = useState('');
  const [subFileUrl, setSubFileUrl] = useState('');

  // Teacher Grading State
  const [gradeScore, setGradeScore] = useState<number>(20);
  const [gradeFeedback, setGradeFeedback] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, asgRes] = await Promise.all([
        platformApi.getCourses(),
        platformApi.getAssignments(selectedCourseId || undefined),
      ]);
      setCourses(coursesRes.data);
      setAssignments(asgRes.data);
      if (asgRes.data.length > 0 && !selectedAssignment) {
        loadAssignmentDetail(asgRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignmentDetail = async (id: string) => {
    try {
      const res = await platformApi.getAssignmentById(id);
      setSelectedAssignment(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCourseId]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMaxScore || !newDueDate) return;
    const courseId = selectedCourseId || (courses[0]?.id ?? '');
    if (!courseId) return;

    try {
      await platformApi.createAssignment({
        courseId,
        title: newTitle,
        description: newDesc,
        maxScore: Number(newMaxScore),
        dueDate: newDueDate,
      });
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء الواجب');
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || (!subText && !subFileUrl)) return;
    try {
      await platformApi.submitAssignment(selectedAssignment.id, subText, subFileUrl);
      setIsSubmitModalOpen(false);
      setSubText('');
      setSubFileUrl('');
      loadAssignmentDetail(selectedAssignment.id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل تسليم الواجب');
    }
  };

  const handleTeacherGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    try {
      await platformApi.gradeSubmission(gradingSubmission.id, gradeScore, gradeFeedback);
      setIsGradeModalOpen(false);
      setGradingSubmission(null);
      if (selectedAssignment) loadAssignmentDetail(selectedAssignment.id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل رصد الدرجة');
    }
  };

  const isStaff = user?.role === 'ORG_ADMIN' || user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">الواجبات والتكليفات الأكاديمية</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة المهام المدرسية، تسليمات الطلاب، والرصد الآلي للدرجات والتقييمات.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">كافة المقررات</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          {isStaff && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              إنشاء واجب جديد
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Assignments List */}
        <div className="lg:col-span-5 space-y-3">
          {assignments.map((asg) => {
            const isSelected = selectedAssignment?.id === asg.id;
            return (
              <div
                key={asg.id}
                onClick={() => loadAssignmentDetail(asg.id)}
                className={`p-5 rounded-3xl border transition cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="blue" size="sm">
                    {asg.maxScore} نقطة
                  </Badge>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    الموعد: {new Date(asg.dueDate).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-100">{asg.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{asg.description}</p>
                </div>

                {isStudent && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">حالة التسليم:</span>
                    {asg.mySubmission ? (
                      asg.mySubmission.score !== undefined ? (
                        <Badge variant="emerald" size="sm">
                          تم التقييم: {asg.mySubmission.score}/{asg.maxScore}
                        </Badge>
                      ) : (
                        <Badge variant="blue" size="sm">
                          تم التسليم (قيد المراجعة)
                        </Badge>
                      )
                    ) : (
                      <Badge variant="amber" size="sm">
                        بانتظار التسليم
                      </Badge>
                    )}
                  </div>
                )}

                {isStaff && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      التسليمات: <strong className="text-slate-200">{asg.submissionsCount || 0}</strong>
                    </span>
                    <span>
                      المصحح: <strong className="text-emerald-400">{asg.gradedCount || 0}</strong>
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {assignments.length === 0 && (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl text-xs text-slate-500">
              لا توجد واجبات منشورة حالياً
            </div>
          )}
        </div>

        {/* Right Side: Assignment Details, Submissions, or Student Actions */}
        <div className="lg:col-span-7">
          {selectedAssignment ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-6 shadow-2xl">
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="emerald">تفاصيل التكليف</Badge>
                  <span className="text-xs text-slate-400 font-mono">الدرجة القصوى: {selectedAssignment.maxScore}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{selectedAssignment.description}</p>
              </div>

              {/* Student View: My Submission Card or Submit Button */}
              {isStudent && (
                <div className="space-y-4">
                  {selectedAssignment.mySubmission ? (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          إجابتك المسلّمة
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(selectedAssignment.mySubmission.submittedAt).toLocaleString('ar-SA')}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-200">
                        {selectedAssignment.mySubmission.submissionText || 'تم إرفاق ملف'}
                      </div>

                      {selectedAssignment.mySubmission.score !== undefined && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-xs">
                          <div className="flex items-center justify-between font-bold text-emerald-300">
                            <span>الدرجة المرصودة:</span>
                            <span>{selectedAssignment.mySubmission.score} / {selectedAssignment.maxScore}</span>
                          </div>
                          {selectedAssignment.mySubmission.teacherFeedback && (
                            <p className="text-slate-300 text-[11px] mt-1">
                              ملاحظات المعلم: {selectedAssignment.mySubmission.teacherFeedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
                      <Clock className="w-8 h-8 text-amber-400 mx-auto" />
                      <div>
                        <span className="font-bold text-sm text-slate-100 block">لم تقم بتسليم هذا الواجب بعد</span>
                        <span className="text-xs text-slate-400">ينتهي موعد التسليم في {new Date(selectedAssignment.dueDate).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <button
                        onClick={() => setIsSubmitModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        تسليم الواجب الآن
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Teacher View: Submissions List */}
              {isStaff && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      تسليمات الطلاب ({selectedAssignment.submissions?.length || 0})
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                      selectedAssignment.submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className="font-bold text-slate-100 block">{sub.studentName || 'طالب'}</span>
                            <p className="text-slate-400 line-clamp-1 text-[11px]">{sub.submissionText}</p>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              تم التسليم: {new Date(sub.submittedAt).toLocaleTimeString('ar-SA')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {sub.score !== undefined ? (
                              <Badge variant="emerald">
                                {sub.score} / {selectedAssignment.maxScore}
                              </Badge>
                            ) : (
                              <Badge variant="amber">بانتظار الرصد</Badge>
                            )}

                            <button
                              onClick={() => {
                                setGradingSubmission(sub);
                                setGradeScore(sub.score || selectedAssignment.maxScore);
                                setGradeFeedback(sub.teacherFeedback || '');
                                setIsGradeModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1"
                            >
                              <Award className="w-3.5 h-3.5 text-emerald-400" />
                              تقييم
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 text-center py-6">لم يقم أي طالب بالتسليم حتى الآن</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-2">
              <ClipboardCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">اختر تكليفاً لعرض تفاصيله وتسليماته</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="إنشاء تكليف / واجب دراسي جديد">
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان الواجب:</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: واجب الوحدة الأولى في الجبر الخطي"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الدرجة القصوى:</label>
              <input
                type="number"
                required
                value={newMaxScore}
                onChange={(e) => setNewMaxScore(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">آخر موعد للتسليم (Due Date):</label>
              <input
                type="datetime-local"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">تفاصيل التكليف والتعليمات:</label>
            <textarea
              rows={4}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="اكتب تعليمات الحل والمسائل المطلوبة..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              نشر التكليف
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Submit Modal */}
      <Modal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} title="تسليم الواجب الدراسي">
        <form onSubmit={handleStudentSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">إجابتك / الحل النصي:</label>
            <textarea
              required
              rows={6}
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
              placeholder="اكتب خطوات الحل أو ملخص الإجابة هنا..."
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الملف أو رابط المرفق (اختياري):</label>
            <input
              type="text"
              value={subFileUrl}
              onChange={(e) => setSubFileUrl(e.target.value)}
              placeholder="مثال: الواجب_الاول_عمر_السعيد.pdf"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              تأكيد التسليم
            </button>
          </div>
        </form>
      </Modal>

      {/* Teacher Grade Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={`تقييم تسليم الطالب: ${gradingSubmission?.studentName || ''}`}
      >
        <form onSubmit={handleTeacherGrade} className="space-y-4 text-sm">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold block text-slate-200 mb-1">إجابة الطالب:</span>
            <p className="whitespace-pre-wrap">{gradingSubmission?.submissionText}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              الدرجة المستحقة (من {selectedAssignment?.maxScore}):
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max={selectedAssignment?.maxScore || 100}
              required
              value={gradeScore}
              onChange={(e) => setGradeScore(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظات وتغذية راجعة للطالب:</label>
            <textarea
              rows={3}
              value={gradeFeedback}
              onChange={(e) => setGradeFeedback(e.target.value)}
              placeholder="أحسنت، إجابة ممتازة وخطوات دقيقة..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsGradeModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              حفظ ورصد الدرجة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
