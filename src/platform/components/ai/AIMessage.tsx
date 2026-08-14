import React, { useState } from 'react';
import { Bot, User as UserIcon, Copy, Check, Sparkles } from 'lucide-react';
import { AIMessage as AIMessageType } from '../../types';

interface AIMessageProps {
  message: AIMessageType;
  userName?: string;
}

export const AIMessage: React.FC<AIMessageProps> = ({ message, userName }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = (content: string) => {
    // Basic Markdown formatting (headings, bold, lists, code)
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-lg font-bold text-slate-900 mt-4 mb-2">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-xl font-black text-slate-900 mt-4 mb-2">
            {line.replace('# ', '')}
          </h2>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="mr-4 my-1 list-disc text-slate-800">
            {formatBold(line.substring(2))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="mr-4 my-1 list-decimal text-slate-800 font-medium">
            {formatBold(line.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="my-1 leading-relaxed text-slate-800">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      className={`flex items-start gap-3.5 my-3.5 ${
        isAssistant ? 'flex-row' : 'flex-row-reverse'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isAssistant
            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
            : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-indigo-500/20'
        }`}
      >
        {isAssistant ? <Bot className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4.5 transition-all text-sm ${
          isAssistant
            ? 'bg-white border border-slate-200/80 shadow-sm text-slate-800 rounded-tr-sm'
            : 'bg-indigo-600 text-white rounded-tl-sm shadow-md shadow-indigo-600/10'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-slate-100/50">
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            {isAssistant ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-800">مرشد رتقاء الذكي</span>
              </>
            ) : (
              <span className="text-white/90">{userName || 'أنت'}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isAssistant && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-slate-400 hover:text-slate-700 transition flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60"
                title="نسخ الرد"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 text-[10px]">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[10px]">نسخ</span>
                  </>
                )}
              </button>
            )}
            <span className={isAssistant ? 'text-slate-400 text-[10px]' : 'text-white/70 text-[10px]'}>
              {new Date(message.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className={isAssistant ? 'text-slate-800' : 'text-white whitespace-pre-wrap'}>
          {isAssistant ? renderContent(message.content) : message.content}
        </div>
      </div>
    </div>
  );
};
