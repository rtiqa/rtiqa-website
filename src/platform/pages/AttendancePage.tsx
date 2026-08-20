import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { Classroom, Course, User, AttendanceSession, AttendanceRecord } from '../types';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Save,
  Users,
  Check,
  Plus,
  Trash2,
  X,
  History,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = usePlatformAuth();
  const isStudentOrParent = user?.role === 'STUDENT' || user?.role === 'PARENT';

  // Teacher / Admin State
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<User[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('طابور الصباح والحضور اليومي');
  const [sessionPeriod, setSessionPeriod] = useState<number>(1);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Student Attendance Summary State
  const [studentSummary, setStudentSummary] = useState<any>(null);

  const loadTeacherInitial = async () => {
    setIsLoading(true);
    try {
      const classRes = await platformApi.getClassrooms();
      setClassrooms(classRes.data);
      if (classRes.data.length > 0) {
        const initialClassId = classRes.data[0].id;
        setSelectedClassroomId(initialClassId);
        await Promise.all([
          loadRoster(initialClassId, selectedDate),
          loadSessions(initialClassId, selectedDate),
        ]);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const loadStudentAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.getStudentAttendanceSummary(user?.id || '');
      setStudentSummary(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async (classroomId: string, date: string) => {
    try {
      const res = await platformApi.getAttendanceSessions({ classroomId, date });
      setSessions(res.data);
      if (res.data.length > 0) {
        setActiveSessionId(res.data[0].id);
      } else {
        setActiveSessionId('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRoster = async (classroomId: string, date: string) => {
    setIsLoading(true);
    try {
      const [studRes, attRes] = await Promise.all([
        platformApi.getUsers({ role: 'STUDENT', classroomId }),
        platformApi.getAttendanceRoster(classroomId, date),
      ]);
      setStudents(studRes.data);

      const map: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
      const notes: Record<string, string> = {};
      studRes.data.forEach((s) => {
        map[s.id] = 'PRESENT';
      });
      attRes.data.forEach((rec: any) => {
        map[rec.studentId] = rec.status;
        if (rec.notes) notes[rec.studentId] = rec.notes;
      });
      setAttendanceMap(map);
      setNotesMap(notes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isStudentOrParent) {
      loadStudentAttendance();
    } else {
      loadTeacherInitial();
    }
  }, [user?.role]);

  const handleClassChange = async (cId: string) => {
    setSelectedClassroomId(cId);
    await Promise.all([loadRoster(cId, selectedDate), loadSessions(cId, selectedDate)]);
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    if (selectedClassroomId) {
      await Promise.all([loadRoster(selectedClassroomId, date), loadSessions(selectedClassroomId, date)]);
    }
  };

  const setStudentStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    const updated: Record<string, any> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomId) return;
    setIsCreatingSession(true);
    try {
      const res = await platformApi.createAttendanceSession({
        classroomId: selectedClassroomId,
        date: selectedDate,
        title: sessionTitle,
        periodNumber: sessionPeriod,
      });
      setShowSessionModal(false);
      await loadSessions(selectedClassroomId, selectedDate);
      setActiveSessionId(res.data.id);
    } catch (e: any) {
      alert(e.message || 'فشل إنشاء جلسة الحضور');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassroomId || !selectedDate) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status: status as string,
        notes: notesMap[studentId] || undefined,
      }));

      if (activeSessionId) {
        await platformApi.submitSessionRollCall(activeSessionId, records);
      } else {
        await platformApi.recordBatchAttendance({
          classroomId: selectedClassroomId,
          date: selectedDate,
          records,
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadSessions(selectedClassroomId, selectedDate);
    } catch (e: any) {
      alert(e.message || 'فشل حفظ سجل الحضور');
    } finally {
      setIsSaving(false);
    }
  };

  if (isStudentOrParent) {
    return (
      <div className="space-y-6">
        {/* Student Attendance Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900/80 to-slate-950/80 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Badge variant="emerald">سجل الحضور والانضباط المدرسي</Badge>
            <h2 className="text-xl sm:text-2xl font-black text-white">تقرير الحضور والغياب اليومي</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              متابعة دقيقة لنسبة حضورك وانضباطك، وأيام التأخير والأعذار المعتمدة.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl">
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">نسبة الحضور</span>
              <span className="text-2xl font-black text-emerald-400">
                {studentSummary?.attendanceRate ?? 100}%
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">إجمالي الأيام</span>
              <span className="text-2xl font-black text-white">
                {studentSummary?.totalDays ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold">حضور</span>
            <span className="text-xl font-bold text-emerald-400 block">{studentSummary?.presentDays ?? 0} يوم</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-rose-500/20 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold">غياب بدون عذر</span>
            <span className="text-xl font-bold text-rose-400 block">{studentSummary?.absentDays ?? 0} يوم</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold">تأخر صباحي</span>
            <span className="text-xl font-bold text-amber-400 block">{studentSummary?.lateDays ?? 0} يوم</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-blue-500/20 text-center space-y-1">
            <span className="text-xs text-slate-400 font-semibold">غياب بعذر معتمد</span>
            <span className="text-xl font-bold text-blue-400 block">{studentSummary?.excusedDays ?? 0} يوم</span>
          </div>
        </div>

        {/* Attendance Log Table */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              سجل الأيام المسجلة
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {studentSummary?.records && studentSummary.records.length > 0 ? (
              studentSummary.records.map((rec: AttendanceRecord) => (
                <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 block">{rec.date}</span>
                    {rec.notes && <span className="text-[11px] text-slate-400">{rec.notes}</span>}
                  </div>

                  <Badge
                    variant={
                      rec.status === 'PRESENT'
                        ? 'emerald'
                        : rec.status === 'LATE'
                        ? 'amber'
                        : rec.status === 'EXCUSED'
                        ? 'blue'
                        : 'rose'
                    }
                  >
                    {rec.status === 'PRESENT'
                      ? 'حاضر'
                      : rec.status === 'LATE'
                      ? 'متأخر'
                      : rec.status === 'EXCUSED'
                      ? 'مستأذن'
                      : 'غائب'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                لا توجد سجلات حضور مسجلة حتى الآن.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Teacher / Admin View
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'LATE').length;
  const excusedCount = Object.values(attendanceMap).filter((s) => s === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">رصد الحضور والغياب اليومي</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            جلسات النداء الصباحي، الحصص الدراسية، تسجيل التأخير والأعذار، وحفظ السجلات فورياً.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-semibold text-slate-200 focus:border-emerald-500 focus:outline-none"
          />

          <select
            value={selectedClassroomId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowSessionModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            جلسة نداء / حصة
          </button>
        </div>
      </div>

      {/* Sessions Bar */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sessions.map((sess) => (
            <button
              key={sess.id}
              onClick={() => setActiveSessionId(sess.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeSessionId === sess.id
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span>{sess.title || `حصة ${sess.periodNumber || 1}`}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-mono ${
                activeSessionId === sess.id ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {sess.presentCount}/{sess.totalCount}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Summary Chips + Quick Actions Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs overflow-x-auto w-full md:w-auto">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
            حاضر: {presentCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold">
            غائب: {absentCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
            متأخر: {lateCount}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold">
            مستأذن: {excusedCount}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => handleMarkAll('PRESENT')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            تحديد الجميع حاضر
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                تم الحفظ بنجاح
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isSaving ? 'جاري الحفظ...' : 'حفظ واعتماد الكشف'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Roll Call Roster List */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-6 py-4 text-start">اسم الطالب</th>
                <th className="px-6 py-4 text-start">الرقم الأكاديمي</th>
                <th className="px-6 py-4 text-center">حالة الحضور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-slate-500">
                    لا يوجد طلاب مسجلين في هذه الشعبة
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const status = attendanceMap[student.id] || 'PRESENT';
                  return (
                    <tr key={student.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block">{student.fullName}</span>
                            <span className="text-[11px] text-slate-500">{student.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">{student.studentIdNumber || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present */}
                          <button
                            onClick={() => setStudentStatus(student.id, 'PRESENT')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                              status === 'PRESENT'
                                ? 'bg-emerald-500 text-slate-950 shadow'
                                : 'bg-slate-950 text-slate-400 hover:text-emerald-300'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            حاضر
                          </button>

                          {/* Late */}
                          <button
                            onClick={() => setStudentStatus(student.id, 'LATE')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                              status === 'LATE'
                                ? 'bg-amber-500 text-slate-950 shadow'
                                : 'bg-slate-950 text-slate-400 hover:text-amber-300'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            متأخر
                          </button>

                          {/* Absent */}
                          <button
                            onClick={() => setStudentStatus(student.id, 'ABSENT')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                              status === 'ABSENT'
                                ? 'bg-rose-500 text-white shadow'
                                : 'bg-slate-950 text-slate-400 hover:text-rose-300'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            غائب
                          </button>

                          {/* Excused */}
                          <button
                            onClick={() => setStudentStatus(student.id, 'EXCUSED')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                              status === 'EXCUSED'
                                ? 'bg-blue-500 text-white shadow'
                                : 'bg-slate-950 text-slate-400 hover:text-blue-300'
                            }`}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            مستأذن
                          </button>
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

      {/* New Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                إنشاء جلسة نداء / رصد حصة
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">عنوان الجلسة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: طابور الصباح أو الحصة الأولى"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">رقم الحصة / الفترة</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={sessionPeriod}
                  onChange={(e) => setSessionPeriod(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSession}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
                >
                  {isCreatingSession ? 'جاري الإنشاء...' : 'إنشاء الجلسة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
