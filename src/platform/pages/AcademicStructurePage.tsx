import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import {
  AcademicYear,
  Term,
  GradeLevel,
  Classroom,
  Subject,
  TeacherAssignment,
  StudentEnrollment,
  ParentStudentLink,
  User,
  Course,
  TeacherAssignmentRole,
  StudentEnrollmentStatus,
  ParentRelationshipType,
} from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import {
  Calendar,
  Layers,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Users,
  GraduationCap,
  HeartHandshake,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react';

type TabType = 'calendar' | 'grades_classrooms' | 'subjects' | 'teacher_assignments' | 'student_enrollments' | 'parent_links';

export const AcademicStructurePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<StudentEnrollment[]>([]);
  const [parentLinks, setParentLinks] = useState<ParentStudentLink[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [isAddTermOpen, setIsAddTermOpen] = useState(false);
  const [isAddGradeOpen, setIsAddGradeOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const [isAddEnrollmentOpen, setIsAddEnrollmentOpen] = useState(false);
  const [isAddParentLinkOpen, setIsAddParentLinkOpen] = useState(false);

  // Form states
  // Year
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('2026-09-01');
  const [newYearEnd, setNewYearEnd] = useState('2027-06-30');
  const [newYearIsCurrent, setNewYearIsCurrent] = useState(false);

  // Term
  const [newTermYearId, setNewTermYearId] = useState('');
  const [newTermName, setNewTermName] = useState('');
  const [newTermStart, setNewTermStart] = useState('2026-09-01');
  const [newTermEnd, setNewTermEnd] = useState('2027-01-15');
  const [newTermIsCurrent, setNewTermIsCurrent] = useState(false);

  // Grade
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeSequence, setNewGradeSequence] = useState(1);

  // Classroom
  const [newClassName, setNewClassName] = useState('');
  const [newClassGradeId, setNewClassGradeId] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState('30');

  // Subject
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [newSubColor, setNewSubColor] = useState('#10b981');

  // Teacher Assignment
  const [newAssignTeacherId, setNewAssignTeacherId] = useState('');
  const [newAssignSubjectId, setNewAssignSubjectId] = useState('');
  const [newAssignClassroomId, setNewAssignClassroomId] = useState('');
  const [newAssignCourseId, setNewAssignCourseId] = useState('');
  const [newAssignYearId, setNewAssignYearId] = useState('');
  const [newAssignRole, setNewAssignRole] = useState<TeacherAssignmentRole>('PRIMARY_TEACHER');
  const [newAssignHours, setNewAssignHours] = useState(4);

  // Student Enrollment
  const [newEnrStudentId, setNewEnrStudentId] = useState('');
  const [newEnrClassroomId, setNewEnrClassroomId] = useState('');
  const [newEnrYearId, setNewEnrYearId] = useState('');
  const [newEnrRollNumber, setNewEnrRollNumber] = useState('');
  const [newEnrStatus, setNewEnrStatus] = useState<StudentEnrollmentStatus>('ACTIVE');

  // Parent Link
  const [newLinkParentId, setNewLinkParentId] = useState('');
  const [newLinkStudentId, setNewLinkStudentId] = useState('');
  const [newLinkRelationship, setNewLinkRelationship] = useState<ParentRelationshipType>('FATHER');
  const [newLinkEmergency, setNewLinkEmergency] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [yRes, tRes, gRes, cRes, sRes, taRes, seRes, plRes, teachRes, studRes, parRes, crsRes] = await Promise.all([
        platformApi.getAcademicYears(),
        platformApi.getTerms(),
        platformApi.getGradeLevels(),
        platformApi.getClassrooms(),
        platformApi.getSubjects(),
        platformApi.getTeacherAssignments(),
        platformApi.getStudentEnrollments(),
        platformApi.getParentStudentLinks(),
        platformApi.getUsers({ role: 'TEACHER' }),
        platformApi.getUsers({ role: 'STUDENT' }),
        platformApi.getUsers({ role: 'PARENT' }),
        platformApi.getCourses(),
      ]);
      setYears(yRes.data);
      setTerms(tRes.data);
      setGrades(gRes.data);
      setClassrooms(cRes.data);
      setSubjects(sRes.data);
      setTeacherAssignments(taRes.data);
      setStudentEnrollments(seRes.data);
      setParentLinks(plRes.data);
      setTeachers(teachRes.data);
      setStudents(studRes.data);
      setParents(parRes.data);
      setCourses(crsRes.data);

      if (yRes.data.length > 0) {
        const currYear = yRes.data.find((y) => y.isCurrent) || yRes.data[0];
        setNewTermYearId(currYear.id);
        setNewAssignYearId(currYear.id);
        setNewEnrYearId(currYear.id);
      }
      if (gRes.data.length > 0) setNewClassGradeId(gRes.data[0].id);
      if (teachRes.data.length > 0) setNewAssignTeacherId(teachRes.data[0].id);
      if (sRes.data.length > 0) setNewAssignSubjectId(sRes.data[0].id);
      if (cRes.data.length > 0) {
        setNewAssignClassroomId(cRes.data[0].id);
        setNewEnrClassroomId(cRes.data[0].id);
      }
      if (studRes.data.length > 0) {
        setNewEnrStudentId(studRes.data[0].id);
        setNewLinkStudentId(studRes.data[0].id);
      }
      if (parRes.data.length > 0) setNewLinkParentId(parRes.data[0].id);
    } catch (e) {
      console.error('Failed to load academic data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName || !newYearStart || !newYearEnd) return;
    try {
      await platformApi.createAcademicYear({
        name: newYearName,
        startDate: newYearStart,
        endDate: newYearEnd,
        isCurrent: newYearIsCurrent,
      });
      setIsAddYearOpen(false);
      setNewYearName('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء السنة الأكاديمية');
    }
  };

  const handleDeleteYear = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه السنة الأكاديمية؟')) return;
    try {
      await platformApi.deleteAcademicYear(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل حذف السنة');
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermName || !newTermYearId || !newTermStart || !newTermEnd) return;
    try {
      await platformApi.createTerm({
        academicYearId: newTermYearId,
        name: newTermName,
        startDate: newTermStart,
        endDate: newTermEnd,
        isCurrent: newTermIsCurrent,
      });
      setIsAddTermOpen(false);
      setNewTermName('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء الفصل الدراسي');
    }
  };

  const handleDeleteTerm = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفصل الدراسي؟')) return;
    try {
      await platformApi.deleteTerm(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل حذف الفصل');
    }
  };

  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName) return;
    try {
      await platformApi.createGradeLevel({
        name: newGradeName,
        sequenceOrder: Number(newGradeSequence) || 1,
      });
      setIsAddGradeOpen(false);
      setNewGradeName('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إضافة المرحلة');
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المرحلة الدراسية؟')) return;
    try {
      await platformApi.deleteGradeLevel(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل حذف المرحلة');
    }
  };

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

  const handleDeleteClassroom = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الشعبة؟')) return;
    try {
      await platformApi.deleteClassroom(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل حذف الشعبة');
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

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المادة الدراسية؟')) return;
    try {
      await platformApi.deleteSubject(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل حذف المادة');
    }
  };

  const handleCreateTeacherAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignTeacherId || !newAssignSubjectId || !newAssignClassroomId) return;
    try {
      await platformApi.createTeacherAssignment({
        teacherId: newAssignTeacherId,
        subjectId: newAssignSubjectId,
        classroomId: newAssignClassroomId,
        courseId: newAssignCourseId || undefined,
        academicYearId: newAssignYearId || undefined,
        role: newAssignRole,
        weeklyHours: Number(newAssignHours) || 4,
        status: 'ACTIVE',
      });
      setIsAddAssignmentOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل تكليف المعلم');
    }
  };

  const handleDeleteTeacherAssignment = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء تكليف المعلم؟')) return;
    try {
      await platformApi.deleteTeacherAssignment(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل حذف التكليف');
    }
  };

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnrStudentId || !newEnrClassroomId || !newEnrYearId) return;
    try {
      await platformApi.createStudentEnrollment({
        studentId: newEnrStudentId,
        classroomId: newEnrClassroomId,
        academicYearId: newEnrYearId,
        rollNumber: newEnrRollNumber || undefined,
        status: newEnrStatus,
      });
      setIsAddEnrollmentOpen(false);
      setNewEnrRollNumber('');
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل تسجيل الطالب');
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء قيد هذا الطالب؟')) return;
    try {
      await platformApi.deleteStudentEnrollment(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل إلغاء القيد');
    }
  };

  const handleCreateParentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkParentId || !newLinkStudentId) return;
    try {
      await platformApi.createParentStudentLink({
        parentId: newLinkParentId,
        studentId: newLinkStudentId,
        relationship: newLinkRelationship,
        isEmergencyContact: newLinkEmergency,
      });
      setIsAddParentLinkOpen(false);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل ربط ولي الأمر بالطالب');
    }
  };

  const handleDeleteParentLink = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من فك ارتباط ولي الأمر بالطالب؟')) return;
    try {
      await platformApi.deleteParentStudentLink(id);
      loadData();
    } catch (e: any) {
      alert(e.message || 'فشل فك الارتباط');
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">النواة والهيكل الأكاديمي الشامل</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            إدارة التقويم، المراحل والشعب، المناهج، تكليف المعلمين، وتسجيل وقيد الطلاب.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'calendar' && (
            <>
              <button
                onClick={() => setIsAddYearOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                سنة أكاديمية
              </button>
              <button
                onClick={() => setIsAddTermOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                فصل دراسي
              </button>
            </>
          )}

          {activeTab === 'grades_classrooms' && (
            <>
              <button
                onClick={() => setIsAddGradeOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-blue-500/30 hover:border-blue-400 text-blue-300 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                مرحلة / صف
              </button>
              <button
                onClick={() => setIsAddClassOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                شعبة / فصل
              </button>
            </>
          )}

          {activeTab === 'subjects' && (
            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة مادة دراسية
            </button>
          )}

          {activeTab === 'teacher_assignments' && (
            <button
              onClick={() => setIsAddAssignmentOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              تكليف معلم جديد
            </button>
          )}

          {activeTab === 'student_enrollments' && (
            <button
              onClick={() => setIsAddEnrollmentOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              تسجيل وقيد طالب
            </button>
          )}

          {activeTab === 'parent_links' && (
            <button
              onClick={() => setIsAddParentLinkOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-rose-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              ربط ولي أمر بطالب
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          التقويم والسنوات ({years.length})
        </button>

        <button
          onClick={() => setActiveTab('grades_classrooms')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'grades_classrooms'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          المراحل والشعب ({grades.length} مراحل / {classrooms.length} شعبة)
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'subjects'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          المواد والمناهج ({subjects.length})
        </button>

        <button
          onClick={() => setActiveTab('teacher_assignments')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'teacher_assignments'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          تكليف المعلمين ({teacherAssignments.length})
        </button>

        <button
          onClick={() => setActiveTab('student_enrollments')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'student_enrollments'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          تسجيل وقيد الطلاب ({studentEnrollments.length})
        </button>

        <button
          onClick={() => setActiveTab('parent_links')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'parent_links'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          أولياء الأمور والطلاب ({parentLinks.length})
        </button>
      </div>

      {/* Tab 1: Calendar & Academic Years */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Academic Years List */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                السنوات الأكاديمية (Academic Years)
              </h3>
            </div>

            <div className="space-y-3">
              {years.map((y) => (
                <div key={y.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{y.name}</span>
                      {y.isCurrent && <Badge variant="emerald">السنة الحالية</Badge>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {y.startDate} إلى {y.endDate}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteYear(y.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="حذف السنة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Terms List */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                الفصول الدراسية (Terms & Semesters)
              </h3>
            </div>

            <div className="space-y-3">
              {terms.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{t.name}</span>
                      {t.isCurrent && <Badge variant="blue" size="sm">الفصل النشط</Badge>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      {t.startDate} إلى {t.endDate}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTerm(t.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="حذف الفصل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Grades & Classrooms */}
      {activeTab === 'grades_classrooms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grades.map((g) => {
              const classInGrade = classrooms.filter((c) => c.gradeLevelId === g.id);
              return (
                <div key={g.id} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">{g.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="blue" size="sm">
                          {classInGrade.length} شعب
                        </Badge>
                        <button
                          onClick={() => handleDeleteGrade(g.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="حذف المرحلة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">الترتيب الأكاديمي: المستوى {g.sequenceOrder}</div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-xs font-semibold text-slate-400 block">الشعب الدراسية:</span>
                      {classInGrade.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">لا توجد شعب مسندة لهذا الصف</p>
                      ) : (
                        <div className="space-y-2">
                          {classInGrade.map((c) => (
                            <div
                              key={c.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-200 block">{c.name}</span>
                                <span className="text-[10px] text-slate-400">السعة: {c.capacity || 30} طالب</span>
                              </div>
                              <button
                                onClick={() => handleDeleteClassroom(c.id)}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                                title="حذف الشعبة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Subjects */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/30 transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-slate-800"
                      style={{ backgroundColor: s.color || '#8b5cf6' }}
                    />
                    <span className="font-bold text-sm text-slate-100">{s.name}</span>
                  </div>
                  <Badge variant="purple" size="sm">
                    {s.code}
                  </Badge>
                </div>
                {s.description ? (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{s.description}</p>
                ) : (
                  <p className="text-xs text-slate-500 italic">لا يوجد وصف للمنهج</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">ID: {s.id.substring(0, 10)}...</span>
                <button
                  onClick={() => handleDeleteSubject(s.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition flex items-center gap-1"
                  title="حذف المادة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Teacher Assignments */}
      {activeTab === 'teacher_assignments' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">المعلم</th>
                  <th className="px-6 py-4">المادة الدراسية</th>
                  <th className="px-6 py-4">الشعبة / الصف</th>
                  <th className="px-6 py-4">المقرر المرتبط</th>
                  <th className="px-6 py-4">الدور والتكليف</th>
                  <th className="px-6 py-4">النصاب الأسبوعي</th>
                  <th className="px-6 py-4">الحالة</th>
                  <th className="px-6 py-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {teacherAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">
                      لا توجد تكليفات معلمين مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  teacherAssignments.map((ta) => (
                    <tr key={ta.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-100">{ta.teacherName}</div>
                        <div className="text-[11px] text-slate-500">{ta.teacherEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-400">{ta.subjectName}</td>
                      <td className="px-6 py-4 font-medium text-slate-200">{ta.classroomName}</td>
                      <td className="px-6 py-4 text-slate-400">{ta.courseTitle || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge variant={ta.role === 'PRIMARY_TEACHER' ? 'emerald' : 'blue'} size="sm">
                          {ta.role === 'PRIMARY_TEACHER' ? 'معلم أساسي' : 'معلم مساعد'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-mono">{ta.weeklyHours || 4} ساعات</td>
                      <td className="px-6 py-4">
                        <Badge variant={ta.status === 'ACTIVE' ? 'emerald' : 'slate'} size="sm">
                          {ta.status === 'ACTIVE' ? 'نشط' : 'معلق'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleDeleteTeacherAssignment(ta.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="إلغاء التكليف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Student Enrollments */}
      {activeTab === 'student_enrollments' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">الطالب</th>
                  <th className="px-6 py-4">رقم القيد / الهوية</th>
                  <th className="px-6 py-4">المرحلة الدراسية</th>
                  <th className="px-6 py-4">الشعبة الحالية</th>
                  <th className="px-6 py-4">رقم المقعد</th>
                  <th className="px-6 py-4">حالة القيد</th>
                  <th className="px-6 py-4">تاريخ التسجيل</th>
                  <th className="px-6 py-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {studentEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">
                      لا توجد قيود تسجيل طلاب مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  studentEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-100">{enr.studentName}</div>
                        <div className="text-[11px] text-slate-500">{enr.studentEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{enr.studentIdNumber || '—'}</td>
                      <td className="px-6 py-4 text-slate-300">{enr.gradeLevelName || '—'}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{enr.classroomName}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{enr.rollNumber || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            enr.status === 'ACTIVE'
                              ? 'emerald'
                              : enr.status === 'TRANSFERRED'
                              ? 'amber'
                              : enr.status === 'GRADUATED'
                              ? 'blue'
                              : 'rose'
                          }
                          size="sm"
                        >
                          {enr.status === 'ACTIVE'
                            ? 'مقيد ونشط'
                            : enr.status === 'TRANSFERRED'
                            ? 'منقول'
                            : enr.status === 'GRADUATED'
                            ? 'متخرج'
                            : 'موقوف'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-400">{new Date(enr.enrolledAt).toLocaleDateString('ar-SA')}</td>
                      <td className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleDeleteEnrollment(enr.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="إلغاء القيد"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Parent-Student Links */}
      {activeTab === 'parent_links' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">ولي الأمر</th>
                  <th className="px-6 py-4">الطالب</th>
                  <th className="px-6 py-4">صلة القرابة</th>
                  <th className="px-6 py-4">جهة اتصال للطوارئ</th>
                  <th className="px-6 py-4">تاريخ الربط</th>
                  <th className="px-6 py-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {parentLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                      لا توجد روابط بين أولياء الأمور والطلاب حالياً
                    </td>
                  </tr>
                ) : (
                  parentLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 font-bold text-slate-100">{link.parentName}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{link.studentName}</td>
                      <td className="px-6 py-4">
                        <Badge variant="blue" size="sm">
                          {link.relationship === 'FATHER'
                            ? 'الأب'
                            : link.relationship === 'MOTHER'
                            ? 'الأم'
                            : 'ولي أمر / وصي'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {link.isEmergencyContact ? (
                          <Badge variant="rose" size="sm">جهة طوارئ معتمدة</Badge>
                        ) : (
                          <span className="text-slate-500">لا</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-400">{new Date(link.createdAt).toLocaleDateString('ar-SA')}</td>
                      <td className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleDeleteParentLink(link.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="فك الارتباط"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Add Year Modal */}
      <Modal isOpen={isAddYearOpen} onClose={() => setIsAddYearOpen(false)} title="إضافة سنة أكاديمية جديدة">
        <form onSubmit={handleCreateYear} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم السنة الأكاديمية:</label>
            <input
              type="text"
              required
              value={newYearName}
              onChange={(e) => setNewYearName(e.target.value)}
              placeholder="مثال: العام الدراسي 2026-2027"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ البداية:</label>
              <input
                type="date"
                required
                value={newYearStart}
                onChange={(e) => setNewYearStart(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ النهاية:</label>
              <input
                type="date"
                required
                value={newYearEnd}
                onChange={(e) => setNewYearEnd(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="yearCurrent"
              checked={newYearIsCurrent}
              onChange={(e) => setNewYearIsCurrent(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="yearCurrent" className="text-xs text-slate-300 cursor-pointer">
              تعيينها كسنة أكاديمية حالية ونشطة
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddYearOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              حفظ السنة الأكاديمية
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Term Modal */}
      <Modal isOpen={isAddTermOpen} onClose={() => setIsAddTermOpen(false)} title="إضافة فصل دراسي جديد">
        <form onSubmit={handleCreateTerm} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">السنة الأكاديمية التابعة:</label>
            <select
              value={newTermYearId}
              onChange={(e) => setNewTermYearId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? '(الحالية)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الفصل الدراسي:</label>
            <input
              type="text"
              required
              value={newTermName}
              onChange={(e) => setNewTermName(e.target.value)}
              placeholder="مثال: الفصل الدراسي الأول"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ البداية:</label>
              <input
                type="date"
                required
                value={newTermStart}
                onChange={(e) => setNewTermStart(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ النهاية:</label>
              <input
                type="date"
                required
                value={newTermEnd}
                onChange={(e) => setNewTermEnd(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="termCurrent"
              checked={newTermIsCurrent}
              onChange={(e) => setNewTermIsCurrent(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="termCurrent" className="text-xs text-slate-300 cursor-pointer">
              تعيينه كفصل دراسي حالي نشط
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddTermOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              حفظ الفصل الدراسي
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Grade Modal */}
      <Modal isOpen={isAddGradeOpen} onClose={() => setIsAddGradeOpen(false)} title="إضافة مرحلة / صف دراسي">
        <form onSubmit={handleCreateGrade} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المرحلة / الصف:</label>
            <input
              type="text"
              required
              value={newGradeName}
              onChange={(e) => setNewGradeName(e.target.value)}
              placeholder="مثال: الصف الحادي عشر (الثاني الثانوي)"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الترتيب التسلسلي:</label>
            <input
              type="number"
              required
              min={1}
              value={newGradeSequence}
              onChange={(e) => setNewGradeSequence(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddGradeOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold"
            >
              حفظ الصف الدراسي
            </button>
          </div>
        </form>
      </Modal>

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
              className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">رمز المادة (Code):</label>
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
              className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold"
            >
              حفظ المادة
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Teacher Assignment Modal */}
      <Modal isOpen={isAddAssignmentOpen} onClose={() => setIsAddAssignmentOpen(false)} title="تكليف معلم بمادة وشعبة">
        <form onSubmit={handleCreateTeacherAssignment} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">المعلم:</label>
            <select
              value={newAssignTeacherId}
              onChange={(e) => setNewAssignTeacherId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">المادة الدراسية:</label>
              <select
                value={newAssignSubjectId}
                onChange={(e) => setNewAssignSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
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
                value={newAssignClassroomId}
                onChange={(e) => setNewAssignClassroomId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">طبيعة الدور:</label>
              <select
                value={newAssignRole}
                onChange={(e) => setNewAssignRole(e.target.value as TeacherAssignmentRole)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="PRIMARY_TEACHER">معلم أساسي (Primary)</option>
                <option value="CO_TEACHER">معلم مشارك (Co-Teacher)</option>
                <option value="ASSISTANT">مساعد تدريس (Assistant)</option>
                <option value="SUBSTITUTE">معلم بديل (Substitute)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">النصاب الأسبوعي (ساعات):</label>
              <input
                type="number"
                min={1}
                max={40}
                value={newAssignHours}
                onChange={(e) => setNewAssignHours(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddAssignmentOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
            >
              حفظ التكليف
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Student Enrollment Modal */}
      <Modal isOpen={isAddEnrollmentOpen} onClose={() => setIsAddEnrollmentOpen(false)} title="تسجيل وقيد طالب في شعبة">
        <form onSubmit={handleCreateEnrollment} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الطالب:</label>
            <select
              value={newEnrStudentId}
              onChange={(e) => setNewEnrStudentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentIdNumber || s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">السنة الأكاديمية:</label>
              <select
                value={newEnrYearId}
                onChange={(e) => setNewEnrYearId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? '(الحالية)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الشعبة المسجّل بها:</label>
              <select
                value={newEnrClassroomId}
                onChange={(e) => setNewEnrClassroomId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">رقم المقعد / التسلسل (Roll Number):</label>
              <input
                type="text"
                value={newEnrRollNumber}
                onChange={(e) => setNewEnrRollNumber(e.target.value)}
                placeholder="مثال: 10A-05"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">حالة القيد:</label>
              <select
                value={newEnrStatus}
                onChange={(e) => setNewEnrStatus(e.target.value as StudentEnrollmentStatus)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ACTIVE">مقيد ونشط (Active)</option>
                <option value="TRANSFERRED">منقول (Transferred)</option>
                <option value="SUSPENDED">موقوف (Suspended)</option>
                <option value="GRADUATED">متخرج (Graduated)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddEnrollmentOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              تسجيل الطالب
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Parent Link Modal */}
      <Modal isOpen={isAddParentLinkOpen} onClose={() => setIsAddParentLinkOpen(false)} title="ربط ولي أمر بطالب">
        <form onSubmit={handleCreateParentLink} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">ولي الأمر:</label>
            <select
              value={newLinkParentId}
              onChange={(e) => setNewLinkParentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.email || p.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الطالب:</label>
            <select
              value={newLinkStudentId}
              onChange={(e) => setNewLinkStudentId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentIdNumber || s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">صلة القرابة:</label>
            <select
              value={newLinkRelationship}
              onChange={(e) => setNewLinkRelationship(e.target.value as ParentRelationshipType)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-rose-500 focus:outline-none"
            >
              <option value="FATHER">الأب (Father)</option>
              <option value="MOTHER">الأم (Mother)</option>
              <option value="GUARDIAN">ولي أمر / وصي قانوني (Guardian)</option>
              <option value="OTHER">أخرى (Other)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="linkEmergency"
              checked={newLinkEmergency}
              onChange={(e) => setNewLinkEmergency(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-rose-500 focus:ring-rose-500"
            />
            <label htmlFor="linkEmergency" className="text-xs text-slate-300 cursor-pointer">
              اعتماده كجهة اتصال أساسية للطوارئ
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddParentLinkOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold"
            >
              حفظ الربط
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
