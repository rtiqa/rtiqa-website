import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { Classroom, Course, User } from '../types';
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
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = usePlatformAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<User[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadInitial = async () => {
    setIsLoading(true);
    try {
      const classRes = await platformApi.getClassrooms();
      setClassrooms(classRes.data);
      if (classRes.data.length > 0) {
        setSelectedClassroomId(classRes.data[0].id);
        loadRoster(classRes.data[0].id, selectedDate);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
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

      // Build status lookup
      const map: Record<string, 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'> = {};
      // Default all to PRESENT
      studRes.data.forEach((s) => {
        map[s.id] = 'PRESENT';
      });
      // Override with recorded
      attRes.data.forEach((rec: any) => {
        map[rec.studentId] = rec.status;
      });
      setAttendanceMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleClassChange = (cId: string) => {
    setSelectedClassroomId(cId);
    loadRoster(cId, selectedDate);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedClassroomId) loadRoster(selectedClassroomId, date);
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

  const handleSaveAttendance = async () => {
    if (!selectedClassroomId || !selectedDate) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status: status as string,
      }));
      await platformApi.recordBatchAttendance({
        classroomId: selectedClassroomId,
        date: selectedDate,
        records,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || 'فشل حفظ سجل الحضور');
    } finally {
      setIsSaving(false);
    }
  };

  // Status counters
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
            متابعة انضباط الطلاب، تسجيل التأخير والأعذار، وحفظ السجلات فورياً.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        </div>
      </div>

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
                {isSaving ? 'جاري الحفظ...' : 'حفظ كشف الحضور'}
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
    </div>
  );
};
