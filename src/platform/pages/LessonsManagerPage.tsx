import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { Course, Lesson, StorageObject } from '../types';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FileUploadZone } from '../components/FileUploadZone';
import { AttachmentViewer } from '../components/AttachmentViewer';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  BookOpen,
  Paperclip,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

export const LessonsManagerPage: React.FC = () => {
  const { user } = usePlatformAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [lessonAttachmentObj, setLessonAttachmentObj] = useState<StorageObject | null>(null);
  const [tempLessonDraftId, setTempLessonDraftId] = useState(`lesson_draft_${Date.now()}`);
  const [refreshAttachmentsTrigger, setRefreshAttachmentsTrigger] = useState(0);

  const handleAIAssistLesson = async () => {
    if (!newTitle.trim()) {
      alert('يرجى كتابة عنوان الدرس أولاً ليتمكن الذكاء الاصطناعي من توليد المحتوى المناسب.');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const res = await platformApi.aiTeacherAssistant({
        prompt: `قم بصياغة محتوى تعليمي مفصل وجذاب بصيغة HTML لدرس بعنوان: "${newTitle}". قم بتضمين مقدمة وأهداف وعناصر الشرح وأمثلة وأسئلة تفكير ختامية.`,
        courseId: selectedCourseId || undefined,
      });
      if (res.success && res.data) {
        setNewContent(res.data.text);
      }
    } catch (e: any) {
      alert('تعذر التوليد الذكي: ' + (e.message || 'خطأ غير معروف'));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.getCourses();
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourseId(res.data[0].id);
        loadLessons(res.data[0].id);
      } else {
        setIsLoading(false);
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const loadLessons = async (courseId: string) => {
    try {
      const res = await platformApi.getLessons(courseId);
      setLessons(res.data);
      if (res.data.length > 0 && !activeLesson) {
        setActiveLesson(res.data[0]);
      }
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
    setActiveLesson(null);
    loadLessons(id);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent || !selectedCourseId) return;
    try {
      const attachmentsList: Array<{ name: string; url: string; size: string }> = [];
      if (lessonAttachmentObj) {
        attachmentsList.push({
          name: lessonAttachmentObj.originalFilename || lessonAttachmentObj.filename,
          url: lessonAttachmentObj.id,
          size: `${Math.round(lessonAttachmentObj.sizeBytes / 1024)} KB`,
        });
      }

      await platformApi.createLesson({
        courseId: selectedCourseId,
        title: newTitle,
        contentHtml: newContent,
        mediaUrl: newMediaUrl || undefined,
        attachments: attachmentsList,
        isPublished,
        orderIndex: lessons.length + 1,
      });
      setIsAddModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewMediaUrl('');
      setLessonAttachmentObj(null);
      setTempLessonDraftId(`lesson_draft_${Date.now()}`);
      setRefreshAttachmentsTrigger((prev) => prev + 1);
      loadLessons(selectedCourseId);
    } catch (e: any) {
      alert(e.message || 'فشل حفظ الدرس');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدرس؟')) return;
    try {
      await platformApi.deleteLesson(id);
      if (activeLesson?.id === id) setActiveLesson(null);
      loadLessons(selectedCourseId);
    } catch (e: any) {
      alert(e.message || 'فشل حذف الدرس');
    }
  };

  const isStaff = user?.role === 'ORG_ADMIN' || user?.role === 'TEACHER';

  return (
    <div className="space-y-6">
      {/* Header & Course Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">المحتوى الأكاديمي والدروس التفاعلية</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            استعراض شروحات المنهج، المرفقات، الوسائط الإثرائية، والملخصات.
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

          {isStaff && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة درس جديد
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Sidebar of Lessons + Active Lesson Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lessons List Navigation */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">وحدات المقرر ({lessons.length})</span>
            <Badge variant="emerald" size="sm">
              مكتمل
            </Badge>
          </div>

          <div className="space-y-2">
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-xs leading-snug line-clamp-2">{lesson.title}</span>
                  </div>

                  {isStaff && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lesson.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {lessons.length === 0 && (
              <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-xs text-slate-500">
                لا توجد دروس مضافة لهذا المقرر بعد
              </div>
            )}
          </div>
        </div>

        {/* Active Lesson Reader Box */}
        <div className="lg:col-span-8">
          {activeLesson ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-6 shadow-2xl">
              {/* Lesson Top Header */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="emerald">الدرس التفاعلي</Badge>
                  <span className="text-xs text-slate-400">
                    آخر تحديث: {new Date(activeLesson.updatedAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {activeLesson.title}
                </h3>
              </div>

              {/* Optional Hero Media / Diagram */}
              {activeLesson.mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-64 sm:max-h-80 bg-slate-950">
                  <img
                    src={activeLesson.mediaUrl}
                    alt={activeLesson.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Lesson HTML Content */}
              <div
                className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: activeLesson.contentHtml }}
              />

              {/* Attachments Section */}
              <AttachmentViewer
                resourceType="lesson_attachment"
                resourceId={activeLesson.id}
                title="المستندات والمرفقات الإثرائية للدرس"
                refreshTrigger={refreshAttachmentsTrigger}
              />

              {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                    المرفقات والمراجع الدراسية المسجلة:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeLesson.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate text-slate-200 font-medium">{att.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{att.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-2">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">اختر درساً من القائمة لبدء القراءة والمتابعة</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Lesson Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="إضافة درس جديد للمقرر" maxWidth="2xl">
        <form onSubmit={handleCreateLesson} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان الدرس:</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: مقدمة في خوارزميات البحث الذكي"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">رابط صورة أو توضيح إثرائي (Media URL):</label>
            <input
              type="text"
              value={newMediaUrl}
              onChange={(e) => setNewMediaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Lesson Attachment File Upload Zone */}
          <FileUploadZone
            resourceType="lesson_attachment"
            resourceId={tempLessonDraftId}
            onUploadSuccess={(storageObj) => setLessonAttachmentObj(storageObj)}
            onRemove={() => setLessonAttachmentObj(null)}
            initialStorageObject={lessonAttachmentObj}
            label="رفع ملف أو مذكرة إثرائية للدرس (اختياري):"
            helpText="PDF، Word، شرائح العرض، أو صور توضيحية حتى 50 ميجابايت"
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">محتوى الدرس والشرح (HTML أو نص):</label>
              <button
                type="button"
                onClick={handleAIAssistLesson}
                disabled={isGeneratingAI}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGeneratingAI ? 'جاري الصياغة الذكية...' : 'صياغة المحتوى بالذكاء الاصطناعي'}
              </button>
            </div>
            <textarea
              required
              rows={8}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="<h3>مقدمة</h3><p>شرح محاور الدرس بالتفصيل...</p>"
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-800"
            />
            <label htmlFor="isPublished" className="text-xs text-slate-300 font-medium">
              نشر الدرس فوراً وإتاحته للطلاب
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              حفظ ونشر الدرس
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
