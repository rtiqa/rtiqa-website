import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { Course, Subject, Classroom, User, Term, PlatformPage } from '../types';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  BookOpen,
  Plus,
  Users,
  FileText,
  ClipboardCheck,
  Award,
  ArrowRight,
} from 'lucide-react';

interface CoursesListPageProps {
  onNavigate: (page: PlatformPage) => void;
  onSelectCourse?: (courseId: string) => void;
}

export const CoursesListPage: React.FC<CoursesListPageProps> = ({ onNavigate, onSelectCourse }) => {
  const { user } = usePlatformAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Course Modal
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newClassroomId, setNewClassroomId] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newTermId, setNewTermId] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, subRes, classRes, teachRes, termRes] = await Promise.all([
        platformApi.getCourses(),
        platformApi.getSubjects(),
        platformApi.getClassrooms(),
        platformApi.getUsers({ role: 'TEACHER' }),
        platformApi.getTerms(),
      ]);
      setCourses(coursesRes.data);
      setSubjects(subRes.data);
      setClassrooms(classRes.data);
      setTeachers(teachRes.data);
      setTerms(termRes.data);

      if (subRes.data.length > 0) setNewSubjectId(subRes.data[0].id);
      if (classRes.data.length > 0) setNewClassroomId(classRes.data[0].id);
      if (teachRes.data.length > 0) setNewTeacherId(teachRes.data[0].id);
      if (termRes.data.length > 0) setNewTermId(termRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSubjectId || !newClassroomId || !newTermId) return;
    try {
      await platformApi.createCourse({
        title: newTitle,
        subjectId: newSubjectId,
        classroomId: newClassroomId,
        teacherId: newTeacherId || undefined,
        termId: newTermId,
        description: newDesc,
      });
      setIsAddCourseOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء المقرر');
    }
  };

  const isStaff = user?.role === 'ORG_ADMIN' || user?.role === 'TEACHER';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">المقررات والمناهج الدراسية</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            استعراض الوحدات التعليمية، الشعب المسندة، والخطط الدراسية التفاعلية.
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsAddCourseOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            إنشاء مقرر دراسي جديد
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">لا توجد مقررات دراسية متاحة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <div
              key={c.id}
              className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 backdrop-blur-xl transition duration-300 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="emerald" size="sm">
                    {c.classroomName || '10-A'}
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">{c.subjectName}</span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-100 group-hover:text-emerald-300 transition">
                    {c.title}
                  </h3>
                  {c.description && <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{c.description}</p>}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>المعلم:</span>
                  <span className="font-bold text-slate-200">{c.teacherName || 'غير مسند'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <button
                    onClick={() => onNavigate('lessons')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex flex-col items-center gap-1 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الدروس</span>
                  </button>
                  <button
                    onClick={() => onNavigate('assignments')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex flex-col items-center gap-1 transition"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>الواجبات</span>
                  </button>
                  <button
                    onClick={() => onNavigate('gradebook')}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex flex-col items-center gap-1 transition"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>الدرجات</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      <Modal isOpen={isAddCourseOpen} onClose={() => setIsAddCourseOpen(false)} title="إنشاء مقرر دراسي جديد">
        <form onSubmit={handleCreateCourse} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان المقرر:</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: الرياضيات المتقدمة - الصف العاشر"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">المادة الأساسية:</label>
              <select
                value={newSubjectId}
                onChange={(e) => setNewSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الشعبة الدراسية:</label>
              <select
                value={newClassroomId}
                onChange={(e) => setNewClassroomId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">المعلم المسؤول:</label>
              <select
                value={newTeacherId}
                onChange={(e) => setNewTeacherId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">بدون تعيين مباشر</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الفصل الدراسي (Term):</label>
              <select
                value={newTermId}
                onChange={(e) => setNewTermId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">وصف المقرر ومحاوره:</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              placeholder="نظرة عامة على المنهج وأهدافه..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddCourseOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              حفظ المقرر
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
