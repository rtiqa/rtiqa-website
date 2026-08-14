import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Plus,
  Trash2,
  BookOpen,
  HelpCircle,
  FileText,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { platformApi } from '../../services/api';
import { AIConversation, AIMessage as AIMessageType, Course, Lesson, AIFeatureType, UserRole } from '../../types';
import { AIMessage } from './AIMessage';
import { AIInput } from './AIInput';
import { AIUsageIndicator } from './AIUsageIndicator';

interface AIChatProps {
  userRole?: UserRole;
  userName?: string;
  initialCourseId?: string;
  initialLessonId?: string;
}

export const AIChat: React.FC<AIChatProps> = ({ userRole, userName, initialCourseId, initialLessonId }) => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageType[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId || '');
  const [selectedFeature, setSelectedFeature] = useState<AIFeatureType>(
    userRole === 'STUDENT' ? 'student_tutor' : 'teacher_assistant'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingHistory, setFetchingHistory] = useState<boolean>(false);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isTeacher = userRole === 'TEACHER' || userRole === 'ORG_ADMIN' || userRole === 'SUPER_ADMIN';

  // Load Initial Data (Conversations, Courses, Usage)
  useEffect(() => {
    loadConversations();
    loadCourses();
    loadUsage();
  }, []);

  // When active conversation changes, load its messages
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversations = async () => {
    try {
      setFetchingHistory(true);
      const res = await platformApi.getAIConversations();
      if (res.success && res.data) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConversationId) {
          setActiveConversationId(res.data[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load conversations:', err.message);
    } finally {
      setFetchingHistory(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await platformApi.getCourses();
      if (res.success && res.data) {
        setCourses(res.data);
      }
    } catch (err: any) {
      console.warn('Failed to load courses:', err.message);
    }
  };

  const loadUsage = async () => {
    try {
      const res = await platformApi.getAIUsage();
      if (res.success && res.data) {
        setUsageSummary(res.data.summary);
      }
    } catch (err: any) {
      console.warn('Failed to load usage:', err.message);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await platformApi.getAIConversation(convId);
      if (res.success && res.data) {
        setMessages(res.data.messages);
      }
    } catch (err: any) {
      setError('تعذر تحميل رسائل المحادثة.');
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await platformApi.deleteAIConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err: any) {
      setError('تعذر حذف المحادثة.');
    }
  };

  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || loading) return;

    setError(null);
    setLoading(true);

    // Optimistic user message preview
    const tempUserMsg: AIMessageType = {
      id: `temp_${Date.now()}`,
      conversationId: activeConversationId || 'temp',
      organizationId: '',
      userId: '',
      role: 'user',
      content: prompt,
      inputTokens: 0,
      outputTokens: 0,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await platformApi.aiChat({
        prompt,
        conversationId: activeConversationId || undefined,
        courseId: selectedCourseId || undefined,
        lessonId: selectedLessonId || undefined,
        feature: selectedFeature,
      });

      if (res.success && res.data) {
        const assistantMsg: AIMessageType = {
          id: res.data.messageId,
          conversationId: res.data.conversationId,
          organizationId: '',
          userId: '',
          role: 'assistant',
          content: res.data.text,
          inputTokens: res.data.inputTokens,
          outputTokens: res.data.outputTokens,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), { ...tempUserMsg, id: `u_${res.data.messageId}` }, assistantMsg]);

        if (!activeConversationId) {
          setActiveConversationId(res.data.conversationId);
          loadConversations();
        }

        // Refresh usage metrics
        loadUsage();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء معالجة الطلب الذكي.');
      // Remove optimistic message on complete failure
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  // Find lessons for selected course
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const lessons: Lesson[] = selectedCourse?.lessons || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]" dir="rtl">
      {/* Sidebar: Conversations History & AI Quota (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full">
        {/* New Chat Button */}
        <button
          type="button"
          onClick={handleStartNewChat}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-2xl transition shadow-md shadow-emerald-600/10 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>محادثة ذكية جديدة</span>
        </button>

        {/* AI Usage Indicator Card */}
        <AIUsageIndicator summary={usageSummary} />

        {/* Conversations List */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 flex-1 flex flex-col min-h-0 shadow-sm">
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>سجل المحادثات السابقة</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {conversations.length} محادثة
            </span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 pl-1">
            {fetchingHistory && conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">جاري تحميل السجل...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Bot className="w-8 h-8 text-slate-300 stroke-1" />
                <span>لا توجد محادثات سابقة بعد. ابدأ بطرح سؤالك الآن!</span>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/70 shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <Sparkles
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{conv.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 rounded transition text-slate-400 shrink-0"
                      title="حذف المحادثة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Stage (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
        {/* Header with Feature Mode & Course Scoping Controls */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
            {isTeacher ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedFeature('teacher_assistant')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedFeature === 'teacher_assistant'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  مساعد المعلم
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeature('question_generator')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedFeature === 'question_generator'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  صانع الاختبارات
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeature('lesson_summary')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedFeature === 'lesson_summary'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  التلخيص
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedFeature('student_tutor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedFeature === 'student_tutor'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  المرشد السقراطي
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeature('lesson_summary')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedFeature === 'lesson_summary'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  تلخيص الدرس
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeature('content_explainer')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedFeature === 'content_explainer'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  تبسيط المفاهيم
                </button>
              </>
            )}
          </div>

          {/* Scoped Context Pickers (Course & Lesson) */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedLessonId('');
              }}
              className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">سياق عام (كافة المقررات)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {selectedCourseId && lessons.length > 0 && (
              <select
                value={selectedLessonId}
                onChange={(e) => setSelectedLessonId(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500 font-medium max-w-[160px] truncate"
              >
                <option value="">كافة دروس المقرر</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border-y border-red-200 px-4 py-2 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
                <Sparkles className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">
                {isTeacher ? 'مساعد المعلم الذكي (Rtiqa AI)' : 'مرشد رتقاء السقراطي الذكي'}
              </h3>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                {isTeacher
                  ? 'أداة أكاديمية متقدمة لمساعدتك في إعداد خطط الدروس، وتصميم سلالم التقييم، وتوليد أسئلة الاختبارات المعيارية بسرعة ودقة.'
                  : 'مساعدك التعليمي التفاعلي الذي يوجهك خطوة بخطوة ويفسر لك المسائل دون إعطاء الإجابات المباشرة لتطوير مهاراتك الذاتية.'}
              </p>

              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-right">
                <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>معايير الأمان والخصوصية الأكاديمية:</span>
                </div>
                <ul className="text-[11px] text-slate-500 space-y-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    عزل تام لبيانات المؤسسة والطلاب (Multi-Tenant Isolation).
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    حماية تلقائية من تسريب البيانات والتوجيهات الخبيثة.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <AIMessage key={msg.id} message={msg} userName={userName} />
              ))}
              {loading && (
                <div className="flex items-center gap-2.5 my-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-3 text-xs text-slate-500 w-fit">
                  <Bot className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>مرشد رتقاء يفكّر ويحلل المخرجات...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3.5 border-t border-slate-100 bg-white">
          <AIInput onSend={handleSendMessage} isLoading={loading} userRole={userRole} />
        </div>
      </div>
    </div>
  );
};
