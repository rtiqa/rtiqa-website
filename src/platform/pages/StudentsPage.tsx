import React, { useState, useEffect } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import {
  UserCheck,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Award,
  AlertTriangle,
  Heart,
  Phone,
  Shield,
  Calendar,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  UserX,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  X,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Badge } from '../components/Badge';
import type {
  StudentRecord,
  StudentBehaviorRecord,
  StudentLifecycleEvent,
  StudentDossier,
  StudentLifecycleStatus,
  StudentBehaviorType,
  Classroom,
  GradeLevel,
  AcademicYear,
} from '../types';

export const StudentsPage: React.FC = () => {
  const { user, organization, apiFetch } = usePlatformAuth();

  // State
  const [students, setStudents] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Selected Student & Modals
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<StudentDossier | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBehaviorOpen, setIsBehaviorOpen] = useState(false);
  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [isBatchPromoteOpen, setIsBatchPromoteOpen] = useState(false);

  // Batch Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Form states
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    nationalId: '',
    dateOfBirth: '2010-01-01',
    gender: 'MALE',
    bloodType: 'UNKNOWN',
    nationality: 'سعودي',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: 'FATHER',
    medicalConditions: '',
    allergies: '',
    specialDietaryNeeds: '',
    previousSchool: '',
    giftedProgram: false,
    classroomId: '',
    academicYearId: '',
  });

  const [editForm, setEditForm] = useState<any>({});

  const [behaviorForm, setBehaviorForm] = useState({
    type: 'MERIT' as StudentBehaviorType,
    title: '',
    description: '',
    points: 5,
    actionTaken: '',
    incidentDate: new Date().toISOString().split('T')[0],
  });

  const [transitionForm, setTransitionForm] = useState({
    newStatus: 'ACTIVE' as StudentLifecycleStatus,
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [batchForm, setBatchForm] = useState({
    targetClassroomId: '',
    targetAcademicYearId: '',
    reason: '',
  });

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Load Students with filters
      const query = new URLSearchParams();
      if (selectedClassroomId) query.set('classroomId', selectedClassroomId);
      if (selectedGradeLevelId) query.set('gradeLevelId', selectedGradeLevelId);
      if (selectedStatus) query.set('status', selectedStatus);
      if (searchTerm) query.set('search', searchTerm);

      const [resStudents, resAcademic] = await Promise.all([
        apiFetch(`/students?${query.toString()}`),
        apiFetch('/academic/summary'),
      ]);

      if (resStudents?.success) {
        setStudents(resStudents.data || []);
      }
      if (resAcademic?.success && resAcademic.data) {
        setClassrooms(resAcademic.data.classrooms || []);
        setGradeLevels(resAcademic.data.gradeLevels || []);
        setAcademicYears(resAcademic.data.academicYears || []);
      }
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassroomId, selectedGradeLevelId, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const openDossier = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDossierOpen(true);
    setIsDossierLoading(true);
    try {
      const res = await apiFetch(`/students/${studentId}/dossier`);
      if (res?.success) {
        setDossier(res.data);
      }
    } catch {
      // Handle error
    } finally {
      setIsDossierLoading(false);
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify(registerForm),
      });
      if (res?.success) {
        setActionSuccess('تم تسجيل الطالب بنجاح في النظام المدرسي');
        setIsRegisterOpen(false);
        setRegisterForm({
          fullName: '',
          email: '',
          nationalId: '',
          dateOfBirth: '2010-01-01',
          gender: 'MALE',
          bloodType: 'UNKNOWN',
          nationality: 'سعودي',
          phone: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelationship: 'FATHER',
          medicalConditions: '',
          allergies: '',
          specialDietaryNeeds: '',
          previousSchool: '',
          giftedProgram: false,
          classroomId: '',
          academicYearId: '',
        });
        loadData();
      } else {
        setActionError(res?.message || 'فشل تسجيل الطالب');
      }
    } catch {
      setActionError('حدث خطأ في الاتصال بالخادم');
    }
  };

  const openEditModal = (student: any) => {
    setSelectedStudentId(student.id);
    setEditForm({
      fullName: student.fullName,
      phone: student.phone || '',
      studentIdNumber: student.studentIdNumber || '',
      nationalId: student.nationalId || student.record?.nationalId || '',
      dateOfBirth: student.dateOfBirth || student.record?.dateOfBirth || '2010-01-01',
      gender: student.gender || student.record?.gender || 'MALE',
      bloodType: student.bloodType || student.record?.bloodType || 'UNKNOWN',
      nationality: student.record?.nationality || 'سعودي',
      emergencyContactName: student.emergencyContactName || student.record?.emergencyContactName || '',
      emergencyContactPhone: student.emergencyContactPhone || student.record?.emergencyContactPhone || '',
      emergencyContactRelationship: student.record?.emergencyContactRelationship || 'FATHER',
      medicalConditions: student.record?.medicalConditions || '',
      allergies: student.record?.allergies || '',
      specialDietaryNeeds: student.record?.specialDietaryNeeds || '',
      previousSchool: student.record?.previousSchool || '',
      specialNeedsNotes: student.record?.specialNeedsNotes || '',
      giftedProgram: student.giftedProgram || student.record?.giftedProgram || false,
      classroomId: student.classroomId || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setActionError(null);
    try {
      const res = await apiFetch(`/students/${selectedStudentId}/profile`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      if (res?.success) {
        setActionSuccess('تم تحديث ملف الطالب بنجاح');
        setIsEditOpen(false);
        loadData();
        if (isDossierOpen) openDossier(selectedStudentId);
      } else {
        setActionError(res?.message || 'فشل تحديث البيانات');
      }
    } catch {
      setActionError('حدث خطأ في الاتصال بالخادم');
    }
  };

  const openBehaviorModal = (studentId: string) => {
    setSelectedStudentId(studentId);
    setBehaviorForm({
      type: 'MERIT',
      title: '',
      description: '',
      points: 5,
      actionTaken: '',
      incidentDate: new Date().toISOString().split('T')[0],
    });
    setIsBehaviorOpen(true);
  };

  const handleLogBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setActionError(null);
    try {
      const res = await apiFetch(`/students/${selectedStudentId}/behavior`, {
        method: 'POST',
        body: JSON.stringify(behaviorForm),
      });
      if (res?.success) {
        setActionSuccess('تم تسجيل الملاحظة السلوكية بنجاح');
        setIsBehaviorOpen(false);
        loadData();
        if (isDossierOpen) openDossier(selectedStudentId);
      } else {
        setActionError(res?.message || 'فشل تسجيل الملاحظة');
      }
    } catch {
      setActionError('حدث خطأ أثناء التسجيل');
    }
  };

  const openTransitionModal = (student: any) => {
    setSelectedStudentId(student.id);
    setTransitionForm({
      newStatus: student.status || 'ACTIVE',
      reason: '',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setIsTransitionOpen(true);
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setActionError(null);
    try {
      const res = await apiFetch(`/students/${selectedStudentId}/status-transition`, {
        method: 'POST',
        body: JSON.stringify(transitionForm),
      });
      if (res?.success) {
        setActionSuccess('تم تغيير الحالة الأكاديمية للطالب بنجاح');
        setIsTransitionOpen(false);
        loadData();
        if (isDossierOpen) openDossier(selectedStudentId);
      } else {
        setActionError(res?.message || 'فشل تغيير الحالة');
      }
    } catch {
      setActionError('حدث خطأ في تنفيذ الانتقال');
    }
  };

  const handleBatchPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;
    setActionError(null);
    try {
      const res = await apiFetch('/students/promote-batch', {
        method: 'POST',
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          targetClassroomId: batchForm.targetClassroomId,
          targetAcademicYearId: batchForm.targetAcademicYearId,
          reason: batchForm.reason,
        }),
      });
      if (res?.success) {
        setActionSuccess(`تم ترقية ${res.data?.promotedCount || selectedStudentIds.length} طالب بنجاح`);
        setIsBatchPromoteOpen(false);
        setSelectedStudentIds([]);
        loadData();
      } else {
        setActionError(res?.message || 'فشل الترقية الجماعية');
      }
    } catch {
      setActionError('حدث خطأ أثناء الترقية الجماعية');
    }
  };

  const toggleSelectStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.id));
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: StudentLifecycleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="emerald">نشط ومنتظم</Badge>;
      case 'PROBATION':
        return <Badge variant="amber">تحت الملاحظة</Badge>;
      case 'SUSPENDED':
        return <Badge variant="rose">موقوف مؤقتاً</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="slate">منسحب</Badge>;
      case 'TRANSFERRED':
        return <Badge variant="blue">منقول لمدرسة أخرى</Badge>;
      case 'GRADUATED':
        return <Badge variant="purple">متخرج</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const totalActive = students.filter((s) => s.status === 'ACTIVE').length;
  const totalGifted = students.filter((s) => s.giftedProgram).length;
  const totalBehaviorBalance = students.reduce((acc, s) => acc + (s.behaviorPoints || 0), 0);

  return (
    <div className="space-y-6 pb-12 font-sans" dir="rtl">
      {/* Toast Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-rose-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">شؤون الطلاب وسجل المعلومات (SIS)</h1>
            <p className="text-xs text-slate-400 mt-1">
              إدارة شاملة للملف الأكاديمي، الرعاية الصحية، السلوك والتميز، وجهات الاتصال للطوارئ
            </p>
          </div>
        </div>

        {['ORG_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsBatchPromoteOpen(true)}
              disabled={selectedStudentIds.length === 0}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                selectedStudentIds.length > 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>ترقية جماعية ({selectedStudentIds.length})</span>
            </button>

            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل طالب جديد</span>
            </button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">إجمالي الطلاب المسجلين</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{students.length}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">في قاعدة بيانات المدرسة الحالية</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">الطلاب المنتظمون (نشط)</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalActive}</p>
          <span className="text-[10px] text-teal-400 mt-1 block font-medium">
            {students.length > 0 ? `${Math.round((totalActive / students.length) * 100)}% نسبة الانتظام` : '100%'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">برامج الموهوبين والتفوق</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalGifted}</p>
          <span className="text-[10px] text-amber-400/80 mt-1 block">مسجلون في مسارات الرعاية الإثرائية</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">صافي نقاط السلوك والتميز</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">+{totalBehaviorBalance}</p>
          <span className="text-[10px] text-purple-400/80 mt-1 block">إجمالي أوسمة وبطاقات السلوك الإيجابي</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl flex flex-col lg:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم، الهوية، أو الرقم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Grade Level Filter */}
        <select
          value={selectedGradeLevelId}
          onChange={(e) => setSelectedGradeLevelId(e.target.value)}
          className="w-full lg:w-48 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">جميع الصفوف الدراسية</option>
          {gradeLevels.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Classroom Filter */}
        <select
          value={selectedClassroomId}
          onChange={(e) => setSelectedClassroomId(e.target.value)}
          className="w-full lg:w-48 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">جميع الشعب والفصول</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full lg:w-44 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">جميع الحالات الأكاديمية</option>
          <option value="ACTIVE">نشط ومنتظم</option>
          <option value="PROBATION">تحت الملاحظة</option>
          <option value="SUSPENDED">موقوف مؤقتاً</option>
          <option value="WITHDRAWN">منسحب</option>
          <option value="TRANSFERRED">منقول</option>
          <option value="GRADUATED">متخرج</option>
        </select>

        {(searchTerm || selectedClassroomId || selectedGradeLevelId || selectedStatus) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedClassroomId('');
              setSelectedGradeLevelId('');
              setSelectedStatus('');
            }}
            className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 transition-colors whitespace-nowrap"
          >
            إعادة تعيين التصفية
          </button>
        )}
      </div>

      {/* Students Directory Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                {['ORG_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedStudentIds.length === students.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
                    />
                  </th>
                )}
                <th className="p-4 font-bold">الطالب</th>
                <th className="p-4 font-bold">الهوية الوطنية / الإقامة</th>
                <th className="p-4 font-bold">الصف والشعبة</th>
                <th className="p-4 font-bold">الحالة الأكاديمية</th>
                <th className="p-4 font-bold">جهة الطوارئ</th>
                <th className="p-4 font-bold text-center">نقاط السلوك</th>
                <th className="p-4 font-bold text-center">الرعاية</th>
                <th className="p-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    جاري تحميل سجلات الطلاب...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    لا يوجد طلاب مطابقين لمعايير البحث الحالية
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      {['ORG_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(student.id)}
                            className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
                          />
                        </td>
                      )}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{student.fullName}</p>
                            <p className="text-[11px] text-slate-400">{student.email}</p>
                            <span className="text-[10px] text-slate-500">
                              رقم القيد: {student.studentIdNumber || '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-300 text-xs">
                        {student.nationalId || student.record?.nationalId || '—'}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-200">{student.gradeLevelName || 'غير مسكن'}</p>
                        <p className="text-[11px] text-slate-400">{student.classroomName || 'لا توجد شعبة'}</p>
                      </td>
                      <td className="p-4">{getStatusBadge(student.status)}</td>
                      <td className="p-4">
                        <p className="font-medium text-slate-200">
                          {student.emergencyContactName || student.record?.emergencyContactName || '—'}
                        </p>
                        {(student.emergencyContactPhone || student.record?.emergencyContactPhone) && (
                          <a
                            href={`tel:${student.emergencyContactPhone || student.record?.emergencyContactPhone}`}
                            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            <span dir="ltr">{student.emergencyContactPhone || student.record?.emergencyContactPhone}</span>
                          </a>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            student.behaviorPoints >= 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {student.behaviorPoints >= 0 ? `+${student.behaviorPoints}` : student.behaviorPoints}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {student.giftedProgram && (
                            <span title="طالب موهوب" className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Sparkles className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {(student.record?.allergies || student.record?.medicalConditions) && (
                            <span title="تنبيه صحي / حساسية" className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <Heart className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {!student.giftedProgram && !student.record?.allergies && !student.record?.medicalConditions && (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openDossier(student.id)}
                            title="الملف الشامل للطالب (Dossier)"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openBehaviorModal(student.id)}
                            title="تسجيل سلوك / تميز"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-700 transition-colors"
                          >
                            <Award className="w-4 h-4" />
                          </button>

                          {['ORG_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '') && (
                            <>
                              <button
                                onClick={() => openEditModal(student)}
                                title="تعديل بيانات الطالب"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => openTransitionModal(student)}
                                title="تغيير الحالة الأكاديمية"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
                              >
                                <Activity className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. STUDENT DOSSIER DRAWER / MODAL */}
      {isDossierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Dossier Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">الملف الشامل للطالب (360° SIS Dossier)</h2>
                  <p className="text-xs text-slate-400">
                    {dossier?.student.fullName} ({dossier?.student.studentIdNumber || dossier?.student.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDossierOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {isDossierLoading ? (
                <div className="py-12 text-center text-slate-500">جاري تجميع السجل الشامل للطالب...</div>
              ) : !dossier ? (
                <div className="py-12 text-center text-rose-400">تعذر تحميل بيانات الطالب</div>
              ) : (
                <>
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block">الحالة الأكاديمية</span>
                      <div className="mt-1">{getStatusBadge(dossier.record?.status || 'ACTIVE')}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">نسبة الحضور</span>
                      <p className="text-base font-black text-emerald-400 mt-0.5">
                        {dossier.attendanceStats.attendanceRate}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">المعدل التراكمي للواجبات</span>
                      <p className="text-base font-black text-blue-400 mt-0.5">
                        {dossier.academicStats.averageScore}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">رصيد السلوك والتميز</span>
                      <p className="text-base font-black text-purple-400 mt-0.5">
                        +{dossier.behaviorPointsTotal} نقطة
                      </p>
                    </div>
                  </div>

                  {/* Section 1: Demographics & Medical */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>البيانات الشخصية والرعاية الصحية</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block">رقم الهوية / الإقامة</span>
                        <p className="font-mono text-slate-200 mt-0.5">{dossier.record?.nationalId || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">تاريخ الميلاد</span>
                        <p className="text-slate-200 mt-0.5">{dossier.record?.dateOfBirth || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">فصيلة الدم</span>
                        <p className="font-bold text-rose-400 mt-0.5">{dossier.record?.bloodType || 'غير محددة'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">الجنسية</span>
                        <p className="text-slate-200 mt-0.5">{dossier.record?.nationality || 'سعودي'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                      <div>
                        <span className="text-[10px] text-slate-500 block">الحالات الصحية والمزمنة</span>
                        <p className="text-slate-300 mt-0.5">{dossier.record?.medicalConditions || 'سليم ولله الحمد'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">الحساسية والمحاذير الغذائية</span>
                        <p className="text-slate-300 mt-0.5">{dossier.record?.allergies || 'لا توجد حساسية مسجلة'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Emergency Contacts & Guardians */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span>جهات الاتصال للطوارئ وأولياء الأمور</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-[10px] text-slate-500 block">اسم جهة الاتصال</span>
                        <p className="text-slate-200 font-bold mt-0.5">
                          {dossier.record?.emergencyContactName || 'ولي الأمر'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">رقم الهاتف</span>
                        <a
                          href={`tel:${dossier.record?.emergencyContactPhone}`}
                          className="text-emerald-400 font-mono mt-0.5 block hover:underline"
                          dir="ltr"
                        >
                          {dossier.record?.emergencyContactPhone}
                        </a>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">صلة القرابة</span>
                        <p className="text-slate-300 mt-0.5">
                          {dossier.record?.emergencyContactRelationship || 'ولي الأمر'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Behavior & Merits Log */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span>سجل السلوك والتميز والتعزيز الإيجابي</span>
                    </h3>
                    {dossier.behaviorRecords.length === 0 ? (
                      <p className="text-slate-500 py-2">لا توجد ملاحظات سلوكية مسجلة حتى الآن</p>
                    ) : (
                      <div className="space-y-2">
                        {dossier.behaviorRecords.map((beh) => (
                          <div
                            key={beh.id}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={beh.points >= 0 ? 'emerald' : 'rose'}>
                                  {beh.points >= 0 ? `+${beh.points} تميز` : `${beh.points} مخالفة`}
                                </Badge>
                                <span className="font-bold text-slate-200">{beh.title}</span>
                                <span className="text-[10px] text-slate-500">({beh.incidentDate})</span>
                              </div>
                              <p className="text-slate-400 text-[11px]">{beh.description}</p>
                              {beh.actionTaken && (
                                <p className="text-slate-500 text-[10px]">
                                  الإجراء المتخذ: <span className="text-slate-300">{beh.actionTaken}</span>
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              بواسطة: {beh.recordedByName || 'المعلم'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 4: Lifecycle History */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>سجل التدرج والقرارات الأكاديمية (Lifecycle Audit)</span>
                    </h3>
                    {dossier.lifecycleHistory.length === 0 ? (
                      <p className="text-slate-500 py-2">لا توجد تغييرات سابقة في الحالة</p>
                    ) : (
                      <div className="space-y-2">
                        {dossier.lifecycleHistory.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">{ev.newStatus}</span>
                              <span className="text-slate-300">{ev.reason}</span>
                            </div>
                            <span className="text-slate-500 text-[10px]">{ev.effectiveDate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. REGISTER NEW STUDENT MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-bold text-white">تسجيل وقبول طالب جديد (SIS Registration)</h2>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">الاسم الثلاثي للطالب *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: طارق زياد الغامدي"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">البريد الإلكتروني الأكاديمي *</label>
                  <input
                    type="email"
                    required
                    placeholder="tariq@school.edu.sa"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">رقم الهوية الوطنية / الإقامة *</label>
                  <input
                    type="text"
                    required
                    placeholder="10XXXXXXXX"
                    value={registerForm.nationalId}
                    onChange={(e) => setRegisterForm({ ...registerForm, nationalId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">تاريخ الميلاد *</label>
                  <input
                    type="date"
                    required
                    value={registerForm.dateOfBirth}
                    onChange={(e) => setRegisterForm({ ...registerForm, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">الجنس *</label>
                  <select
                    value={registerForm.gender}
                    onChange={(e) => setRegisterForm({ ...registerForm, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="MALE">ذكر</option>
                    <option value="FEMALE">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">فصيلة الدم</label>
                  <select
                    value={registerForm.bloodType}
                    onChange={(e) => setRegisterForm({ ...registerForm, bloodType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UNKNOWN">غير محددة</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">الشعبة الدراسية (الصف)</label>
                  <select
                    value={registerForm.classroomId}
                    onChange={(e) => setRegisterForm({ ...registerForm, classroomId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">تسكين لاحقاً</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">العام الدراسي</label>
                  <select
                    value={registerForm.academicYearId}
                    onChange={(e) => setRegisterForm({ ...registerForm, academicYearId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">العام الحالي الافتراضي</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="font-bold text-slate-200 mb-2">جهة الاتصال للطوارئ *</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">اسم ولي الأمر / جهة الطوارئ *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: زياد الغامدي (الأب)"
                      value={registerForm.emergencyContactName}
                      onChange={(e) => setRegisterForm({ ...registerForm, emergencyContactName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">رقم الهاتف للطوارئ *</label>
                    <input
                      type="text"
                      required
                      placeholder="+96650XXXXXXX"
                      value={registerForm.emergencyContactPhone}
                      onChange={(e) => setRegisterForm({ ...registerForm, emergencyContactPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">صلة القرابة</label>
                    <select
                      value={registerForm.emergencyContactRelationship}
                      onChange={(e) => setRegisterForm({ ...registerForm, emergencyContactRelationship: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="FATHER">الأب</option>
                      <option value="MOTHER">الأم</option>
                      <option value="GUARDIAN">ولي أمر / وصي</option>
                      <option value="OTHER">أخرى</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Medical and Care */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="font-bold text-slate-200 mb-2">الرعاية الصحية والموهبة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">الحالات الصحية أو الأمراض المزمنة</label>
                    <input
                      type="text"
                      placeholder="لا توجد"
                      value={registerForm.medicalConditions}
                      onChange={(e) => setRegisterForm({ ...registerForm, medicalConditions: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">الحساسية والمحاذير</label>
                    <input
                      type="text"
                      placeholder="حساسية الفول السوداني..."
                      value={registerForm.allergies}
                      onChange={(e) => setRegisterForm({ ...registerForm, allergies: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="giftedCheck"
                    checked={registerForm.giftedProgram}
                    onChange={(e) => setRegisterForm({ ...registerForm, giftedProgram: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30"
                  />
                  <label htmlFor="giftedCheck" className="text-slate-300 font-medium cursor-pointer">
                    تسجيل الطالب في برامج رعاية الموهوبين والتفوق
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  حفظ وتسجيل الطالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. LOG BEHAVIOR / MERIT MODAL */}
      {isBehaviorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>تسجيل ملاحظة سلوكية / تميز</span>
              </h2>
              <button onClick={() => setIsBehaviorOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogBehavior} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">نوع السجل *</label>
                <select
                  value={behaviorForm.type}
                  onChange={(e) =>
                    setBehaviorForm({
                      ...behaviorForm,
                      type: e.target.value as StudentBehaviorType,
                      points: e.target.value.includes('INFRACTION') ? -2 : 5,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="MERIT">تميز وإنجاز أكاديمي / وسام (+ نقاط)</option>
                  <option value="POSITIVE_PRAISE">ثناء وسلوك إيجابي (+ نقاط)</option>
                  <option value="MINOR_INFRACTION">مخالفة سلوكية بسيطة (- نقاط)</option>
                  <option value="MAJOR_INFRACTION">مخالفة سلوكية جسيمة (- نقاط)</option>
                  <option value="COUNSELING_REFERRAL">إحالة للإرشاد الطلابي</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">عنوان الملاحظة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: التفوق في معرض العلوم..."
                  value={behaviorForm.title}
                  onChange={(e) => setBehaviorForm({ ...behaviorForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">التفاصيل والوصف *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="وصف الحدث أو الإنجاز..."
                  value={behaviorForm.description}
                  onChange={(e) => setBehaviorForm({ ...behaviorForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">النقاط المكتسبة / المخصومة</label>
                  <input
                    type="number"
                    value={behaviorForm.points}
                    onChange={(e) => setBehaviorForm({ ...behaviorForm, points: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">تاريخ الحدث</label>
                  <input
                    type="date"
                    value={behaviorForm.incidentDate}
                    onChange={(e) => setBehaviorForm({ ...behaviorForm, incidentDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">الإجراء المتخذ (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: منح شهادة تفوق مع إشعار ولي الأمر"
                  value={behaviorForm.actionTaken}
                  onChange={(e) => setBehaviorForm({ ...behaviorForm, actionTaken: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBehaviorOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. LIFECYCLE STATUS TRANSITION MODAL */}
      {isTransitionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>تعديل الحالة الأكاديمية للطالب (Lifecycle)</span>
              </h2>
              <button onClick={() => setIsTransitionOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStatusTransition} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">الحالة الأكاديمية الجديدة *</label>
                <select
                  value={transitionForm.newStatus}
                  onChange={(e) => setTransitionForm({ ...transitionForm, newStatus: e.target.value as StudentLifecycleStatus })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">نشط ومنتظم (Active)</option>
                  <option value="PROBATION">تحت الملاحظة الأكاديمية (Probation)</option>
                  <option value="SUSPENDED">موقوف مؤقتاً (Suspended)</option>
                  <option value="WITHDRAWN">منسحب نهائياً (Withdrawn)</option>
                  <option value="TRANSFERRED">منقول لمدرسة أخرى (Transferred)</option>
                  <option value="GRADUATED">متخرج (Graduated)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">سبب التغيير والقرار الأكاديمي *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="سبب الانتقال الأكاديمي أو القرار الإداري..."
                  value={transitionForm.reason}
                  onChange={(e) => setTransitionForm({ ...transitionForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">تاريخ سريان القرار</label>
                <input
                  type="date"
                  value={transitionForm.effectiveDate}
                  onChange={(e) => setTransitionForm({ ...transitionForm, effectiveDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransitionOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  اعتماد القرار الأكاديمي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. BATCH PROMOTION MODAL */}
      {isBatchPromoteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>الترقية والترحيل الجماعي ({selectedStudentIds.length} طالب)</span>
              </h2>
              <button onClick={() => setIsBatchPromoteOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchPromote} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">الشعبة والصف المستهدف *</label>
                <select
                  required
                  value={batchForm.targetClassroomId}
                  onChange={(e) => setBatchForm({ ...batchForm, targetClassroomId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">اختر الشعبة الدراسية</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">العام الدراسي المستهدف *</label>
                <select
                  required
                  value={batchForm.targetAcademicYearId}
                  onChange={(e) => setBatchForm({ ...batchForm, targetAcademicYearId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">اختر العام الدراسي</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">ملاحظات الترقية</label>
                <input
                  type="text"
                  placeholder="ترقية نهاية العام الدراسي..."
                  value={batchForm.reason}
                  onChange={(e) => setBatchForm({ ...batchForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchPromoteOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  تنفيذ الترقية للطلاب المحددين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT STUDENT PROFILE MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" />
                <span>تعديل السجل وملف الطالب</span>
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">رقم الهوية الوطنية / الإقامة</label>
                  <input
                    type="text"
                    value={editForm.nationalId || ''}
                    onChange={(e) => setEditForm({ ...editForm, nationalId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || '2010-01-01'}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">فصيلة الدم</label>
                  <select
                    value={editForm.bloodType || 'UNKNOWN'}
                    onChange={(e) => setEditForm({ ...editForm, bloodType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="UNKNOWN">غير محددة</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">الشعبة الدراسية</label>
                  <select
                    value={editForm.classroomId || ''}
                    onChange={(e) => setEditForm({ ...editForm, classroomId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">لا توجد شعبة</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="font-bold text-slate-200 mb-2">جهة الاتصال للطوارئ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">اسم جهة الطوارئ</label>
                    <input
                      type="text"
                      value={editForm.emergencyContactName || ''}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">رقم الهاتف للطوارئ</label>
                    <input
                      type="text"
                      value={editForm.emergencyContactPhone || ''}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Health Notes */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="font-bold text-slate-200 mb-2">الملاحظات الصحية والموهبة</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">الحالات الصحية أو المزمنة</label>
                    <input
                      type="text"
                      value={editForm.medicalConditions || ''}
                      onChange={(e) => setEditForm({ ...editForm, medicalConditions: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">الحساسية والمحاذير الغذائية</label>
                    <input
                      type="text"
                      value={editForm.allergies || ''}
                      onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editGiftedCheck"
                    checked={editForm.giftedProgram || false}
                    onChange={(e) => setEditForm({ ...editForm, giftedProgram: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500/30"
                  />
                  <label htmlFor="editGiftedCheck" className="text-slate-300 font-medium cursor-pointer">
                    برامج الموهوبين والتفوق
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
