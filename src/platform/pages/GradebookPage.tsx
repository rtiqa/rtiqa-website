import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { Course } from '../types';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import { Award, Download, BookOpen, Percent, CheckCircle2 } from 'lucide-react';

export const GradebookPage: React.FC = () => {
  const { user } = usePlatformAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [gradebookData, setGradebookData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.getCourses();
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourseId(res.data[0].id);
        loadGradebook(res.data[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const loadGradebook = async (courseId: string) => {
    try {
      const res = await platformApi.getCourseGradebook(courseId);
      setGradebookData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCourseChange = (id: string) => {
    setSelectedCourseId(id);
    loadGradebook(id);
  };

  const handleExportCsv = async () => {
    if (!selectedCourseId) return;
    try {
      const res = await platformApi.exportGradebookCsv(selectedCourseId);
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `كشف_درجات_${gradebookData?.courseTitle || 'مقرر'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      alert(e.message || 'فشل تصدير كشف الدرجات');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">سجل الدرجات وكشوف التقييم</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            مصفوفة الدرجات التفصيلية، حساب المتوسطات، والتصدير المباشر المعتمد.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            onClick={handleExportCsv}
            disabled={!gradebookData}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            تصدير كشف Excel / CSV
          </button>
        </div>
      </div>

      {/* Grade Matrix Table */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-slate-200">
              {gradebookData?.courseTitle || 'كشف الدرجات'} &bull; شعبة {gradebookData?.classroomName || '10-A'}
            </span>
          </div>
          <Badge variant="emerald" size="sm">
            إجمالي التكليفات: {gradebookData?.assignments?.length || 0}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-300">
            <thead className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-3.5 text-start">اسم الطالب</th>
                <th className="px-4 py-3.5 text-start">الرقم الأكاديمي</th>
                {gradebookData?.assignments?.map((asg: any) => (
                  <th key={asg.id} className="px-4 py-3.5 text-center">
                    <div>{asg.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal">({asg.maxScore} درجة)</div>
                  </th>
                ))}
                <th className="px-6 py-3.5 text-center font-black text-emerald-400">المجموع النهائي</th>
                <th className="px-6 py-3.5 text-center font-black text-emerald-400">النسبة المئوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : gradebookData?.rows?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    لا توجد بيانات طلاب أو درجات مسجلة في هذا المقرر
                  </td>
                </tr>
              ) : (
                gradebookData?.rows?.map((row: any) => (
                  <tr key={row.studentId} className="hover:bg-slate-800/30 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-100">{row.studentName}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">{row.studentIdNumber || '—'}</td>
                    {gradebookData?.assignments?.map((asg: any) => {
                      const score = row.scores[asg.id];
                      return (
                        <td key={asg.id} className="px-4 py-3.5 text-center font-mono">
                          {score !== undefined ? (
                            <span className="text-slate-200 font-bold">{score}</span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
