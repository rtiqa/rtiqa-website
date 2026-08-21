import React, { useState, useRef } from 'react';
import { platformApi } from '../services/api';
import { StorageObject, StorageResourceType } from '../types';
import {
  Upload,
  FileText,
  FileCheck,
  AlertCircle,
  X,
  Loader2,
  Download,
  ExternalLink,
} from 'lucide-react';

interface FileUploadZoneProps {
  resourceType: StorageResourceType;
  resourceId: string;
  accept?: string;
  maxSizeBytes?: number; // default 50MB
  onUploadSuccess: (storageObject: StorageObject) => void;
  onRemove?: () => void;
  initialStorageObject?: StorageObject | null;
  label?: string;
  helpText?: string;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.webp', '.txt'];
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024; // 50MB

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  resourceType,
  resourceId,
  accept = '.pdf,.docx,.doc,.xlsx,.pptx,.png,.jpg,.jpeg,.webp,.txt',
  maxSizeBytes = DEFAULT_MAX_BYTES,
  onUploadSuccess,
  onRemove,
  initialStorageObject = null,
  label = 'رفع ملف أو مستند إثرائي',
  helpText = 'يدعم ملفات PDF و Word و الصور حتى 50 ميجابايت',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedObject, setUploadedObject] = useState<StorageObject | null>(initialStorageObject);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `حجم الملف (${formatFileSize(file.size)}) يتجاوز الحد الأقصى المسموح به وهو ${formatFileSize(maxSizeBytes)}.`;
    }

    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return `نوع الملف (${fileExt}) غير مدعوم. الصيغ المقبولة: PDF, Word, Excel, PowerPoint, الصور.`;
    }

    return null;
  };

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storageObj = await platformApi.uploadFileToStorage({
        file,
        resourceType,
        resourceId,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setUploadedObject(storageObj);
      onUploadSuccess(storageObj);
    } catch (err: any) {
      console.error('[FileUploadZone] Upload failed:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownload = async (storageObj: StorageObject) => {
    setIsDownloading(true);
    try {
      const res = await platformApi.getStorageDownloadUrl(storageObj.id, storageObj.originalFilename || storageObj.filename);
      if (res.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('تعذر استخراج رابط التحميل الآمن.');
      }
    } catch (err: any) {
      alert('خطأ أثناء تحميل الملف: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemove = () => {
    setUploadedObject(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-semibold text-slate-300">{label}</label>}

      {/* Uploaded File Pill / State */}
      {uploadedObject ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="truncate text-right">
              <span className="font-semibold text-slate-200 block truncate" title={uploadedObject.originalFilename || uploadedObject.filename}>
                {uploadedObject.originalFilename || uploadedObject.filename}
              </span>
              <span className="text-[10px] text-emerald-400/80">
                {formatFileSize(uploadedObject.sizeBytes)} • تم الرفع والتخزين بنجاح
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleDownload(uploadedObject)}
              disabled={isDownloading}
              title="تحميل / فتح الملف"
              className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 transition flex items-center gap-1"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleRemove}
              title="إلغاء أو استبدال الملف"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : isUploading ? (
        /* Uploading State with Progress Bar */
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2 font-medium">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              جاري رفع الملف إلى التخزين السحابي الآمن...
            </span>
            <span className="font-mono text-emerald-400 font-bold">{uploadProgress}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        /* Dropzone Trigger */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer p-4 rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center gap-2 text-center ${
            isDragging
              ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-400 hover:text-slate-300'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
            <Upload className="w-4 h-4" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-300">
              اسحب الملف وأفلته هنا، أو <span className="text-emerald-400 underline">تصفح من جهازك</span>
            </p>
            {helpText && <p className="text-[11px] text-slate-500 mt-0.5">{helpText}</p>}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
