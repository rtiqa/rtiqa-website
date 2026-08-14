import React, { useState } from 'react';
import { Modal } from './Modal';
import { platformApi } from '../services/api';
import { Classroom, Invitation, UserRole } from '../types';
import { Send, Copy, Check, AlertCircle, Link as LinkIcon, ShieldCheck } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classrooms: Classroom[];
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  classrooms,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [classroomId, setClassroomId] = useState('');
  const [teacherSpecialization, setTeacherSpecialization] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInvite, setCreatedInvite] = useState<(Invitation & { inviteLink: string }) | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.createInvitation({
        email,
        fullName: fullName || undefined,
        role,
        classroomId: classroomId || undefined,
        teacherSpecialization: role === 'TEACHER' ? teacherSpecialization || undefined : undefined,
        studentIdNumber: role === 'STUDENT' ? studentIdNumber || undefined : undefined,
        expiresInDays,
      });

      setCreatedInvite(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل إرسال الدعوة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdInvite) return;
    const fullUrl = `${window.location.origin}${createdInvite.inviteLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setCreatedInvite(null);
    setEmail('');
    setFullName('');
    setTeacherSpecialization('');
    setStudentIdNumber('');
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="إرسال دعوة انضمام للمنصة"
      maxWidth="lg"
    >
      {createdInvite ? (
        <div className="space-y-5 text-sm">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-0.5">تم إنشاء رابط الدعوة بنجاح</h4>
              <p className="text-xs text-slate-300">
                يمكن للمستخدم ({createdInvite.email}) إكمال تفعيل الحساب وتعيين كلمة المرور عبر الرابط أدناه.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">رمز الدعوة السري (Invite Code):</label>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-center text-lg font-black tracking-widest text-emerald-400 select-all">
              {createdInvite.inviteCode}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">رابط الانضمام المباشر:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${createdInvite.inviteLink}`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'تم النسخ' : 'نسخ الرابط'}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-emerald-400 hover:underline font-bold"
            >
              + إنشاء دعوة لمستخدم آخر
            </button>
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الدور في المؤسسة *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'STUDENT', label: 'طالب' },
                { id: 'TEACHER', label: 'معلم' },
                { id: 'ORG_ADMIN', label: 'إداري مدرسة' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id as UserRole)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    role === r.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@school.edu.sa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الكامل (اختياري)</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: فيصل العبدالله"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {role === 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الشعبة الدراسية</label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">اختيار الشعبة...</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الرقم الأكاديمي (اختياري)</label>
                <input
                  type="text"
                  value={studentIdNumber}
                  onChange={(e) => setStudentIdNumber(e.target.value)}
                  placeholder="STD-2026-09"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {role === 'TEACHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">التخصص الأكاديمي</label>
              <input
                type="text"
                value={teacherSpecialization}
                onChange={(e) => setTeacherSpecialization(e.target.value)}
                placeholder="مثال: الرياضيات والفيزياء"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">مدة صلاحية الدعوة (أيام)</label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value={3}>3 أيام</option>
              <option value={7}>7 أيام (موصى به)</option>
              <option value={14}>14 يوماً</option>
              <option value={30}>30 يوماً</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء وإرسال الدعوة'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
