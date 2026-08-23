import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  Award,
  AlertTriangle,
  Radio,
  Clock,
  Send,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { platformApi } from '../services/api';
import type { NotificationItem, UserRole } from '../types';

interface NotificationCenterProps {
  userRole: UserRole;
  onNavigate?: (page: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userRole, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTargetRole, setBroadcastTargetRole] = useState<string>('ALL');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and interval
  const fetchUnreadCount = async () => {
    try {
      const res = await platformApi.getUnreadNotificationCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Non-fatal
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await platformApi.getNotifications(filter === 'unread');
      if (res.success && res.data) {
        setNotifications(res.data);
        if (res.meta) {
          setUnreadCount(res.meta.unreadCount);
        }
      }
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await platformApi.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await platformApi.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;

    setBroadcastSending(true);
    setBroadcastSuccessMsg(null);
    try {
      const res = await platformApi.broadcastNotification({
        title: broadcastTitle.trim(),
        body: broadcastBody.trim(),
        targetRole: broadcastTargetRole === 'ALL' ? undefined : broadcastTargetRole,
        channels: ['IN_APP', 'EMAIL'],
      });

      if (res.success) {
        setBroadcastSuccessMsg(res.data.message || 'تم إرسال الإشعار بنجاح لجميع المستلمين');
        setBroadcastTitle('');
        setBroadcastBody('');
        fetchNotifications();
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastSuccessMsg(null);
        }, 1800);
      }
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الإشعار العام');
    } finally {
      setBroadcastSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ASSIGNMENT_CREATED':
      case 'ASSIGNMENT_DUE':
        return <ClipboardCheck className="w-4 h-4 text-emerald-400" />;
      case 'SUBMISSION_GRADED':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'ATTENDANCE_ABSENT':
      case 'ATTENDANCE_LATE':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'BEHAVIOR_LOGGED':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'ANNOUNCEMENT':
        return <Radio className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-teal-400" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'الآن';
    if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
    if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
    return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  const canBroadcast = userRole === 'ORG_ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'TEACHER';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="التنبيهات والإشعارات"
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-rose-500 rounded-full ring-2 ring-slate-950 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">مركز الإشعارات</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {unreadCount} غير مقروء
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  title="تحديد الكل كمقروء"
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition px-2 py-1 rounded-lg hover:bg-slate-800"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">قراءة الكل</span>
                </button>
              )}

              {canBroadcast && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowBroadcastModal(true);
                  }}
                  title="إرسال تعميم جديد"
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold transition px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
                >
                  <Send className="w-3 h-3" />
                  <span>تعميم</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-800/80 bg-slate-950/40 p-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${
                filter === 'all' ? 'bg-slate-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`flex-1 py-1 text-xs font-bold rounded-lg transition ${
                filter === 'unread' ? 'bg-slate-800 text-slate-100 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              غير المقروءة ({unreadCount})
            </button>
          </div>

          {/* List Area */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">جاري تحميل الإشعارات...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-slate-500 px-4">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">لا توجد إشعارات حالياً</p>
                <p className="text-[11px] text-slate-600 mt-0.5">ستظهر التنبيهات والأحداث الأكاديمية هنا فور حدوثها</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.isRead) handleMarkAsRead(item.id);
                  }}
                  className={`p-3 transition cursor-pointer flex gap-3 hover:bg-slate-800/40 ${
                    !item.isRead ? 'bg-slate-800/25 border-s-2 border-emerald-500' : 'opacity-80'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-800/80 shrink-0 h-fit">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{item.title}</h4>
                      <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{item.body}</p>

                    {item.channels && item.channels.length > 1 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {item.channels.map((ch) => (
                          <span
                            key={ch}
                            className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      title="تعليم كمقروء"
                      className="p-1 text-slate-500 hover:text-emerald-400 self-center shrink-0"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Broadcast Modal for Admins/Teachers */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowBroadcastModal(false)}
              className="absolute top-4 start-4 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">إرسال تعميم وإشعار للمدرسة</h3>
                <p className="text-xs text-slate-400">بث فوري عبر لوحة الإشعارات والبريد الإلكتروني</p>
              </div>
            </div>

            {broadcastSuccessMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                {broadcastSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">الفئة المستهدفة</label>
                <select
                  value={broadcastTargetRole}
                  onChange={(e) => setBroadcastTargetRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">جميع منسوبي المدرسة (معلمين، طلاب، أولياء أمور)</option>
                  <option value="STUDENT">الطلاب فقط</option>
                  <option value="PARENT">أولياء الأمور فقط</option>
                  <option value="TEACHER">المعلمين فقط</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">عنوان التعميم / الإشعار</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: موعد انطلاق الاختبارات الشهرية"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">نص الرسالة والتفاصيل</label>
                <textarea
                  required
                  rows={4}
                  placeholder="اكتب نص الإشعار هنا بالتفصيل..."
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {broadcastSending ? (
                    'جاري الإرسال...'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>إرسال التعميم</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
