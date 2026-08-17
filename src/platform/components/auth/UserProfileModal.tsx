import React, { useState } from 'react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';
import {
  User,
  Mail,
  Smartphone,
  ShieldCheck,
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    organization,
    updateProfile,
    changePassword,
    sendEmailVerification,
    unlinkProvider,
    switchOrganization,
    isLoading,
  } = usePlatformAuth();

  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'SECURITY' | 'ORGANIZATIONS'>('IDENTITY');

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    try {
      await updateProfile({ fullName, phone, avatarUrl });
      setFeedbackMessage({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'فشل التحديث' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMessage(null);
    if (newPassword !== confirmPassword) {
      setFeedbackMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين' });
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedbackMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'فشل تغيير كلمة المرور' });
    }
  };

  const handleVerifyEmail = async () => {
    setFeedbackMessage(null);
    try {
      const res = await sendEmailVerification();
      setFeedbackMessage({
        type: 'success',
        text: res.alreadyVerified ? 'البريد الإلكتروني موثق بالفعل' : 'تم إرسال رابط تأكيد البريد الإلكتروني',
      });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'فشل إرسال التأكيد' });
    }
  };

  const handleUnlink = async (provider: any) => {
    setFeedbackMessage(null);
    try {
      await unlinkProvider(provider);
      setFeedbackMessage({ type: 'success', text: `تم إلغاء ربط ${provider} بنجاح` });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'تعذر إلغاء الربط' });
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    setFeedbackMessage(null);
    try {
      await switchOrganization(orgId);
      setFeedbackMessage({ type: 'success', text: 'تم تبديل المدرسة بنجاح' });
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'تعذر التبديل' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-xs text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                user.fullName.charAt(0)
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{user.fullName}</h3>
              <span className="text-[11px] text-slate-400">{user.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('IDENTITY');
              setFeedbackMessage(null);
            }}
            className={`py-2 rounded-xl transition ${
              activeTab === 'IDENTITY' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            بيانات الهوية
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('SECURITY');
              setFeedbackMessage(null);
            }}
            className={`py-2 rounded-xl transition ${
              activeTab === 'SECURITY' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الأمان ووسائل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ORGANIZATIONS');
              setFeedbackMessage(null);
            }}
            className={`py-2 rounded-xl transition ${
              activeTab === 'ORGANIZATIONS' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            عضويات المدارس
          </button>
        </div>

        {/* Alert Feedback */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* TAB 1: IDENTITY */}
        {activeTab === 'IDENTITY' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">الاسم المعروض:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">رابط الصورة الشخصية (Avatar):</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">رقم الهاتف:</label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966501234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none text-left font-mono"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SECURITY & AUTH PROVIDERS */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-5">
            {/* Linked Identity Providers */}
            <div className="space-y-2.5">
              <span className="text-slate-300 font-bold block">وسائل تسجيل الدخول المرتبطة بحسابك:</span>

              {/* Email Provider */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-200 block">{user.email}</span>
                    <span className="text-[10px] text-slate-400">
                      {user.emailVerified ? 'موثق ✅' : 'غير موثق'}
                    </span>
                  </div>
                </div>
                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold"
                  >
                    إرسال رابط توثيق
                  </button>
                )}
              </div>

              {/* Google Provider */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-blue-400">G</span>
                  <div>
                    <span className="font-semibold text-slate-200 block">حساب Google</span>
                    <span className="text-[10px] text-slate-400">
                      {user.authProviders?.includes('google') ? 'مرتبط بحسابك' : 'غير مرتبط'}
                    </span>
                  </div>
                </div>
                {user.authProviders?.includes('google') ? (
                  <button
                    type="button"
                    onClick={() => handleUnlink('google')}
                    disabled={user.authProviders.length <= 1}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-30"
                    title="إلغاء الربط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-44">
                    <GoogleAuthButton label="ربط Google" />
                  </div>
                )}
              </div>

              {/* Phone Provider */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-slate-200 block">رقم الهاتف</span>
                    <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                      {user.phone || 'غير مسجل'}
                    </span>
                  </div>
                </div>
                {user.authProviders?.includes('phone') && user.phone && (
                  <button
                    type="button"
                    onClick={() => handleUnlink('phone')}
                    disabled={user.authProviders.length <= 1}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition disabled:opacity-30"
                    title="إلغاء الربط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Change Password Section */}
            <form onSubmit={handleChangePassword} className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-slate-300 font-bold block flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                تغيير كلمة المرور:
              </span>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">كلمة المرور الحالية:</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">كلمة المرور الجديدة:</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">تأكيد كلمة المرور:</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !newPassword}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  تحديث كلمة المرور
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: ORGANIZATIONS & TENANTS */}
        {activeTab === 'ORGANIZATIONS' && (
          <div className="space-y-3">
            <span className="text-slate-300 font-bold block">المؤسسات والمدارس المرتبطة بحسابك:</span>

            <div className="space-y-2">
              {(user.memberships && user.memberships.length > 0
                ? user.memberships
                : [
                    {
                      id: 'm1',
                      userId: user.id,
                      organizationId: organization?.id || user.organizationId,
                      role: user.role,
                      isDefault: true,
                      status: 'ACTIVE' as const,
                      joinedAt: new Date().toISOString(),
                    },
                  ]
              ).map((mem) => {
                const isActiveTenant = mem.organizationId === organization?.id;
                return (
                  <div
                    key={mem.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      isActiveTenant
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className={`w-5 h-5 ${isActiveTenant ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <span className="font-bold block">
                          {isActiveTenant ? organization?.name : `مؤسسة #${mem.organizationId.slice(0, 8)}`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          الدور: <span className="text-emerald-400 font-semibold">{mem.role}</span>
                        </span>
                      </div>
                    </div>

                    {isActiveTenant ? (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold">
                        المدرسة النشطة حالياً
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSwitchOrg(mem.organizationId)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                      >
                        التبديل إلى هذه المدرسة
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
