import React, { useState } from 'react';
import { Modal } from './Modal';
import { platformApi } from '../services/api';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye, ArrowRight } from 'lucide-react';
import { Classroom } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classrooms: Classroom[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classrooms,
}) => {
  const [targetRole, setTargetRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(classrooms[0]?.id || '');
  const [csvText, setCsvText] = useState<string>(
    'الاسم,البريد الإلكتروني,الرقم الأكاديمي,رقم الهاتف\nعبدالله السالم,abdullah.salem@horizon.edu.sa,STD-2026-101,0501112233\nهند الشمري,hind.shammari@horizon.edu.sa,STD-2026-102,0502223344\nياسر القحطاني,yasser.q@horizon.edu.sa,STD-2026-103,0503334455'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{
    summary: { totalRows: number; validCount: number; errorCount: number; targetRole: string };
    preview: Array<{
      row: number;
      fullName: string;
      email: string;
      identifier?: string;
      phone?: string;
      isValid: boolean;
      errorMessage?: string;
    }>;
  } | null>(null);

  const [importResult, setImportResult] = useState<{
    totalRows: number;
    importedCount: number;
    failedCount: number;
    errors: { row: number; reason: string }[];
  } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        setPreviewData(null);
        setImportResult(null);
      };
      reader.readAsText(file);
    }
  };

  const handlePreview = async () => {
    if (!csvText.trim()) return;
    setIsPreviewing(true);
    try {
      const res = await platformApi.previewImportCsv(csvText, targetRole, selectedClassroomId);
      setPreviewData(res);
    } catch (err: any) {
      alert(err.message || 'فشل فحص بيانات الملف');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setIsSubmitting(true);
    setImportResult(null);

    try {
      const res = await platformApi.importStudentsCsv(
        csvText,
        targetRole === 'STUDENT' ? selectedClassroomId : undefined,
        targetRole
      );
      if (res.success) {
        setImportResult(res.summary);
        onSuccess();
      }
    } catch (err: any) {
      alert(err.message || 'فشل استيراد الملف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadSample = () => {
    const sample =
      targetRole === 'STUDENT'
        ? 'الاسم,البريد الإلكتروني,الرقم الأكاديمي,رقم الهاتف\nمحمد العتيبي,mohammed@school.edu.sa,STD-2026-005,0555555555\nسارة الغامدي,sarah@school.edu.sa,STD-2026-006,0555555556'
        : 'الاسم,البريد الإلكتروني,التخصص الأكاديمي,رقم الهاتف\nد. فهد الدوسري,fahad.d@school.edu.sa,الرياضيات والفيزياء,0501234567\nأ. نورة الشهري,noura.s@school.edu.sa,اللغة العربية,0507654321';
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `نموذج_استيراد_${targetRole === 'STUDENT' ? 'الطلاب' : 'المعلمين'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setPreviewData(null);
        setImportResult(null);
        onClose();
      }}
      title="استيراد جماعي عبر ملف (Bulk CSV Import)"
      maxWidth="2xl"
    >
      <div className="space-y-4 text-sm">
        {/* Role Selector & Sample Download */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">نوع المستخدمين:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setTargetRole('STUDENT');
                  setPreviewData(null);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  targetRole === 'STUDENT'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                الطلاب
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetRole('TEACHER');
                  setPreviewData(null);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                  targetRole === 'TEACHER'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                المعلمون
              </button>
            </div>
          </div>

          <button
            onClick={handleDownloadSample}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            تحميل النموذج ({targetRole === 'STUDENT' ? 'الطلاب' : 'المعلمين'})
          </button>
        </div>

        {/* Classroom Selection for Students */}
        {targetRole === 'STUDENT' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              تعيين الصف والشعبة للطلاب المستوردين:
            </label>
            <select
              value={selectedClassroomId}
              onChange={(e) => {
                setSelectedClassroomId(e.target.value);
                setPreviewData(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="">بدون تعيين فوري (تحديد لاحقاً)</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Upload / Paste Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">محتوى ملف CSV أو لصق البيانات المباشرة:</label>
            <label className="cursor-pointer text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium">
              <Upload className="w-3.5 h-3.5" />
              اختيار ملف من جهازك
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setPreviewData(null);
            }}
            rows={5}
            dir="auto"
            placeholder={
              targetRole === 'STUDENT'
                ? 'الاسم,البريد الإلكتروني,الرقم الأكاديمي,رقم الهاتف...'
                : 'الاسم,البريد الإلكتروني,التخصص الأكاديمي,رقم الهاتف...'
            }
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Preview Dry Run Table */}
        {previewData && (
          <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {previewData.summary.validCount} صف صالح
                </span>
                {previewData.summary.errorCount > 0 && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {previewData.summary.errorCount} صف يحتوي أخطاء
                  </span>
                )}
              </div>
              <span className="text-slate-400">إجمالي الصفوف: {previewData.summary.totalRows}</span>
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800/60 divide-y divide-slate-800/60 text-xs">
              {previewData.preview.map((row) => (
                <div
                  key={row.row}
                  className={`p-2 flex items-center justify-between gap-2 ${
                    row.isValid ? 'bg-slate-900/40' : 'bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 text-slate-400 font-mono text-[10px]">#{row.row}</span>
                    <span className="font-bold text-white truncate">{row.fullName || 'بدون اسم'}</span>
                    <span className="text-slate-400 text-[11px] font-mono truncate">{row.email}</span>
                  </div>
                  <div className="shrink-0">
                    {row.isValid ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        جاهز للاستيراد
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                        {row.errorMessage}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Import Result Banner */}
        {importResult && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-semibold text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                تم استيراد {importResult.importedCount} مستخدم بنجاح!
              </span>
              {importResult.failedCount > 0 && (
                <span className="flex items-center gap-1.5 text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  تعذر استيراد {importResult.failedCount} صف
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || !csvText.trim()}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/50 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            {isPreviewing ? 'جاري الفحص...' : 'فحص وتدقيق البيانات (Preview)'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isSubmitting || !csvText.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? 'جاري الاستيراد...' : 'بدء الاستيراد الفعلي'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
