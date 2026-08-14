import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, BookOpen, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';

interface AIInputProps {
  onSend: (prompt: string) => void;
  isLoading: boolean;
  userRole?: UserRole;
}

export const AIInput: React.FC<AIInputProps> = ({ onSend, isLoading, userRole }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isTeacher = userRole === 'TEACHER' || userRole === 'ORG_ADMIN' || userRole === 'SUPER_ADMIN';

  const teacherSuggestions = [
    { label: 'إعداد خطة درس تفاعلية', icon: BookOpen, text: 'اقترح خطة درس تفاعلية لمدة 45 دقيقة تتضمن أهداف بلوم وأنشطة صفية وتقييماً تكوينياً.' },
    { label: 'صياغة أسئلة اختبار مع الإجابات', icon: HelpCircle, text: 'أنشئ 5 أسئلة اختيار من متعدد مع الإجابات النموذجية والشرح التعليمي.' },
    { label: 'تصميم سلم تقييم (Rubric)', icon: CheckCircle2, text: 'صمم سلم تقييم تحليلي (Rubric) لمشروع فصلي مقسم إلى 4 معايير.' },
  ];

  const studentSuggestions = [
    { label: 'اشرح لي هذا المفهوم خطوة بخطوة', icon: Sparkles, text: 'اشرح لي المفهوم الأساسي بطريقة مبسطة مع مثال عملي خطوة بخطوة.' },
    { label: 'لخص أهم أفكار الدرس', icon: FileText, text: 'لخص لي أهم النقاط والمصطلحات في هذا الدرس مع أسئلة مراجعة ذاتية.' },
    { label: 'اختبر فهمي بسؤال توجيهي', icon: HelpCircle, text: 'اطرح علي سؤالاً لاختبار فهمي واستمع لإجابتي ثم وجهني.' },
  ];

  const suggestions = isTeacher ? teacherSuggestions : studentSuggestions;

  return (
    <div className="w-full">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          مقترحات سريعة:
        </span>
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setText(s.text);
                textareaRef.current?.focus();
              }}
              disabled={isLoading}
              className="text-xs bg-slate-100/80 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-200 text-slate-700 rounded-full px-3 py-1 transition shrink-0 flex items-center gap-1.5 font-medium disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-slate-500" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative bg-white border border-slate-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl p-2 transition shadow-sm">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isTeacher
              ? 'اكتب سؤالك أو اطلب مساعدة في تحضير الدرس أو الاختبارات (اضغط Enter للإرسال)...'
              : 'اطرح سؤالك على المرشد الذكي وسيقوم بتوجيهك خطوة بخطوة...'
          }
          rows={1}
          disabled={isLoading}
          className="w-full resize-none bg-transparent border-0 focus:ring-0 focus:outline-none p-2 text-sm text-slate-900 placeholder:text-slate-400 max-h-32"
          dir="rtl"
        />

        <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1 px-1">
          <span className="text-[11px] text-slate-400">
            Shift + Enter لسطر جديد
          </span>

          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري التوليد...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 -scale-x-100" />
                <span>إرسال</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
