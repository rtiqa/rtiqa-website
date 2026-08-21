import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { StorageObject, StorageResourceType } from '../types';
import { FileText, Download, Loader2, Paperclip } from 'lucide-react';

interface AttachmentViewerProps {
  resourceType: StorageResourceType;
  resourceId: string;
  title?: string;
  refreshTrigger?: number;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  resourceType,
  resourceId,
  title = 'المرفقات والمستندات',
  refreshTrigger = 0,
}) => {
  const [attachments, setAttachments] = useState<StorageObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) return;
    let isMounted = true;
    setIsLoading(true);

    platformApi
      .getResourceStorageObjects(resourceType, resourceId)
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setAttachments(res.data);
        }
      })
      .catch((err) => {
        console.error('[AttachmentViewer] Failed to load attachments:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resourceType, resourceId, refreshTrigger]);

  const handleDownload = async (storageObj: StorageObject) => {
    setDownloadingId(storageObj.id);
    try {
      const res = await platformApi.getStorageDownloadUrl(storageObj.id, storageObj.originalFilename || storageObj.filename);
      if (res.success && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('تعذر استخراج رابط التحميل الآمن للملف.');
      }
    } catch (err: any) {
      alert('خطأ أثناء تحميل الملف: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setDownloadingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
        جاري تحميل المرفقات...
      </div>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-slate-800">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
        <span>{title} ({attachments.length}):</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition text-xs"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="truncate text-right">
                <span className="font-semibold text-slate-200 block truncate" title={file.originalFilename || file.filename}>
                  {file.originalFilename || file.filename}
                </span>
                <span className="text-[10px] text-slate-500">{formatFileSize(file.sizeBytes)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownload(file)}
              disabled={downloadingId === file.id}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-emerald-950/80 text-slate-300 hover:text-emerald-300 transition flex-shrink-0 ml-2"
              title="تحميل الملف"
            >
              {downloadingId === file.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
