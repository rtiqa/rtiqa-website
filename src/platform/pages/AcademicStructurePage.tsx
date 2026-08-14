import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { AcademicYear, Term, GradeLevel, Classroom, Subject } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Calendar,
  Layers,
  BookOpen,
  Plus,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const AcademicStructurePage: React.FC = () => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);

  // New Classroom State
  const [newClassName, setNewClassName] = useState('');
  const [newClassGradeId, setNewClassGradeId] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('30');

  // New Subject State
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [newSubColor, setNewSubColor] = useState('#10b981');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [yRes, tRes, gRes, cRes, sRes] = await Promise.all([
        platformApi.getAcademicYears(),
        platformApi.getTerms(),
        platformApi.getGradeLevels(),
        platformApi.getClassrooms(),
        platformApi.getSubjects(),
      ]);
      setYears(yRes.data);
      setTerms(tRes.data);
      setGrades(gRes.data);
      setClassrooms(cRes.data);
      setSubjects(sRes.data);
      if (gRes.data.length > 0) setNewClassGradeId(gRes.data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newClassGradeId) return;
    try {
      await platformApi.createClassroom({
        name: newClassName,
        gradeLevelId: newClassGradeId,
        capacity: Number(newClassCapacity) || 30,
      });
      setIsAddClassOpen(false);
      setNewClassName('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء الشعبة');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubCode) return;
    try {
      await platformApi.createSubject({
        name: newSubName,
        code: newSubCode,
        description: newSubDesc,
        color: newSubColor,
      });
      setIsAddSubjectOpen(false);
      setNewSubName('');
      setNewSubCode('');
      setNewSubDesc('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء المادة');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">الهيكل الأكاديمي والصفوف والمناهج</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة السنوات الأكاديمية، الفصول الدراسية، المستويات التعليمية، والشعب والمواد.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة مادة تعليمية
          </button>
          <button
            onClick={() => setIsAddClassOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            إضافة شعبة / فصل
          </button>
        </div>
      </div>

      {/* Grid of Academic Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Years & Terms */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            السنة والتقويم الأكاديمي
          </h3>

          <div className="space-y-3">
            {years.map((y) => (
              <div key={y.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-100">{y.name}</span>
                  {y.isCurrent && <Badge variant="emerald">السنة الحالية</Badge>}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {y.startDate} إلى {y.endDate}
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-2">الفصول الدراسية (Terms):</span>
              <div className="space-y-2">
                {terms.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-medium">{t.name}</span>
                    {t.isCurrent && <Badge variant="blue" size="sm">الفصل النشط</Badge>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Grade Levels & Classrooms */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              الصفوف والشعب الدراسية
            </h3>
          </div>

          <div className="space-y-3">
            {grades.map((g) => {
              const classInGrade = classrooms.filter((c) => c.gradeLevelId === g.id);
              return (
                <div key={g.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-200">{g.name}</span>
                    <Badge variant="blue" size="sm">
                      {classInGrade.length} شعب
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {classInGrade.map((c) => (
                      <div
                        key={c.id}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center"
                      >
                        <span className="font-bold text-xs text-slate-300 block">{c.name}</span>
                        <span className="text-[10px] text-slate-500">سعة: {c.capacity || 30}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subjects & Curriculum Catalog */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              المواد والمناهج الدراسية
            </h3>
            <span className="text-xs text-slate-400">{subjects.length} مادة</span>
          </div>

          <div className="space-y-3">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/30 transition space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: s.color || '#8b5cf6' }}
                    />
                    <span className="font-bold text-xs text-slate-200">{s.name}</span>
                  </div>
                  <Badge variant="purple" size="sm">
                    {s.code}
                  </Badge>
                </div>
                {s.description && <p className="text-[11px] text-slate-400">{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Classroom Modal */}
      <Modal isOpen={isAddClassOpen} onClose={() => setIsAddClassOpen(false)} title="إضافة شعبة / فصل دراسي جديد">
        <form onSubmit={handleCreateClassroom} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">المرحلة / الصف الدراسي:</label>
            <select
              value={newClassGradeId}
              onChange={(e) => setNewClassGradeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الشعبة:</label>
            <input
              type="text"
              required
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="مثال: 10-C (شعبة ج)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">السعة الاستيعابية للطلاب:</label>
            <input
              type="number"
              value={newClassCapacity}
              onChange={(e) => setNewClassCapacity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddClassOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              حفظ الشعبة
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal isOpen={isAddSubjectOpen} onClose={() => setIsAddSubjectOpen(false)} title="إضافة مادة دراسية جديدة">
        <form onSubmit={handleCreateSubject} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المادة:</label>
            <input
              type="text"
              required
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="مثال: علم البيانات والذكاء الاصطناعي"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">رمز المادة (Course Code):</label>
              <input
                type="text"
                required
                value={newSubCode}
                onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                placeholder="AI-201"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">اللون التعريفي:</label>
              <input
                type="color"
                value={newSubColor}
                onChange={(e) => setNewSubColor(e.target.value)}
                className="w-full h-10 p-1 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">وصف المنهج:</label>
            <textarea
              value={newSubDesc}
              onChange={(e) => setNewSubDesc(e.target.value)}
              rows={3}
              placeholder="مخرجات التعلم والمحاور الرئيسية..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              حفظ المادة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
