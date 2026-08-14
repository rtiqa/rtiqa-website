import React, { useState, useEffect } from 'react';
import { platformApi } from '../services/api';
import { User, Classroom, UserRole, Invitation } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { CsvImportModal } from '../components/CsvImportModal';
import { InviteUserModal } from '../components/InviteUserModal';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Trash2,
  Send,
  Link,
  Copy,
  Check,
  GraduationCap,
  Briefcase,
  Shield,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'STUDENT' | 'TEACHER' | 'ORG_ADMIN' | 'INVITATIONS'>('ALL');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STUDENT');
  const [newPhone, setNewPhone] = useState('');
  const [newStudentIdNumber, setNewStudentIdNumber] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newClassroomId, setNewClassroomId] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'INVITATIONS') {
        const [invRes, classRes] = await Promise.all([
          platformApi.getInvitations(),
          platformApi.getClassrooms(),
        ]);
        setInvitations(invRes.data);
        setClassrooms(classRes.data);
      } else {
        const roleParam = activeTab === 'ALL' ? undefined : activeTab;
        const [usersRes, classRes] = await Promise.all([
          platformApi.getUsers({ role: roleParam, classroomId: selectedClassroom, search }),
          platformApi.getClassrooms(),
        ]);
        setUsers(usersRes.data);
        setClassrooms(classRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, selectedClassroom]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await platformApi.createUser({
        fullName: newFullName,
        email: newEmail,
        role: newRole,
        phone: newPhone,
        studentIdNumber: newStudentIdNumber,
        teacherSpecialization: newSpecialization,
        classroomId: newClassroomId || undefined,
      });
      setIsAddUserOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewStudentIdNumber('');
      setNewSpecialization('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة المستخدم');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب (${name})؟`)) return;
    try {
      await platformApi.deleteUser(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل حذف المستخدم');
    }
  };

  const handleRevokeInvitation = async (id: string, email: string) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء دعوة (${email})؟`)) return;
    try {
      await platformApi.revokeInvitation(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'فشل إلغاء الدعوة');
    }
  };

  const handleCopyInviteLink = (invite: Invitation) => {
    const fullUrl = `${window.location.origin}/platform/invite/${invite.inviteCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedInviteId(invite.id);
    setTimeout(() => setCopiedInviteId(null), 2500);
  };

  const getClassroomName = (id?: string) => {
    if (!id) return 'غير محدد';
    const found = classrooms.find((c) => c.id === id);
    return found ? found.name : 'شعبة محذوفة';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">إدارة الطلاب والمعلمين</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            سجل الحسابات، البيانات الأكاديمية، الشعب الدراسية، والدعوات الترحيبية للمنصة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            استيراد جماعي (CSV)
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            إرسال دعوة انضمام
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            إضافة مستخدم يدوي
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'الجميع' },
            { id: 'STUDENT', label: 'الطلاب' },
            { id: 'TEACHER', label: 'المعلمون' },
            { id: 'ORG_ADMIN', label: 'الإدارة' },
            { id: 'INVITATIONS', label: 'الدعوات المرسلة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Classroom Filter for Users */}
        {activeTab !== 'INVITATIONS' && (
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {classrooms.length > 0 && (
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="">جميع الشعب</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="بحث بالاسم أو البريد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </form>
          </div>
        )}
      </div>

      {/* Main Table View */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-medium text-xs">جاري تحميل البيانات...</div>
      ) : activeTab === 'INVITATIONS' ? (
        // Invitations Table
        invitations.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Send className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300">لا توجد دعوات مرسلة حالياً</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              يمكنك إرسال دعوة لمعلم أو طالب برمز سري ورابط تفعيل مباشر ينتهي بعد 7 أيام.
            </p>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition"
            >
              إرسال أول دعوة الآن
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                    <th className="p-4">البريد الإلكتروني</th>
                    <th className="p-4">الدور المستهدف</th>
                    <th className="p-4">رمز الدعوة</th>
                    <th className="p-4">الشعبة / التخصص</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">تاريخ الانتهاء</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {invitations.map((inv) => {
                    const isExpired = new Date(inv.expiresAt).getTime() < Date.now();
                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/20 transition">
                        <td className="p-4">
                          <div className="font-bold text-white">{inv.email}</div>
                          {inv.fullName && <div className="text-[11px] text-slate-400">{inv.fullName}</div>}
                        </td>
                        <td className="p-4">
                          <Badge variant={inv.role === 'STUDENT' ? 'info' : inv.role === 'TEACHER' ? 'success' : 'warning'}>
                            {inv.role === 'STUDENT' ? 'طالب' : inv.role === 'TEACHER' ? 'معلم' : 'إداري'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] font-bold text-emerald-400 select-all">
                            {inv.inviteCode}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {inv.classroomName || inv.teacherSpecialization || '—'}
                        </td>
                        <td className="p-4">
                          {inv.isUsed ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> تم القبول
                            </span>
                          ) : isExpired ? (
                            <span className="flex items-center gap-1 text-rose-400 font-bold">
                              <XCircle className="w-3.5 h-3.5" /> منتهية
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400 font-bold">
                              <Clock className="w-3.5 h-3.5" /> بانتظار القبول
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {new Date(inv.expiresAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!inv.isUsed && !isExpired && (
                              <button
                                onClick={() => handleCopyInviteLink(inv)}
                                title="نسخ رابط الدعوة"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                              >
                                {copiedInviteId === inv.id ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleRevokeInvitation(inv.id, inv.email)}
                              title="إلغاء الدعوة"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : users.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-300">لم يتم العثور على مستخدمين</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            قم بإضافة مستخدمين يدويًا أو استخدم ميزة الاستيراد الجماعي بواسطة ملف CSV.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold">
                  <th className="p-4">المستخدم</th>
                  <th className="p-4">الدور</th>
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">الشعبة / التخصص</th>
                  <th className="p-4">رقم الهاتف / الأكاديمي</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          u.role === 'ORG_ADMIN'
                            ? 'warning'
                            : u.role === 'TEACHER'
                            ? 'success'
                            : 'info'
                        }
                      >
                        {u.role === 'ORG_ADMIN'
                          ? 'إداري مدرسة'
                          : u.role === 'TEACHER'
                          ? 'معلم'
                          : 'طالب'}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono text-slate-300">{u.email}</td>
                    <td className="p-4">
                      {u.role === 'STUDENT' ? (
                        <span className="text-slate-300">{getClassroomName(u.classroomId)}</span>
                      ) : u.role === 'TEACHER' ? (
                        <span className="text-emerald-400">{u.teacherSpecialization || 'معلم عام'}</span>
                      ) : (
                        <span className="text-amber-400">إدارة النظام</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">
                      {u.studentIdNumber || u.phone || '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          u.isActive ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      />
                      <span className="mr-1.5 text-slate-400">{u.isActive ? 'نشط' : 'معطل'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        title="حذف الحساب"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Add User Modal */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="إضافة مستخدم جديد">
        <form onSubmit={handleCreateUser} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الدور في المدرسة *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'STUDENT', label: 'طالب' },
                { id: 'TEACHER', label: 'معلم' },
                { id: 'ORG_ADMIN', label: 'إداري مدرسة' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setNewRole(r.id as UserRole)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    newRole === r.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الرباعي الكامل *</label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="مثال: خالد محمد العتيبي"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@school.edu.sa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم الجوال</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {newRole === 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الشعبة الدراسية</label>
                <select
                  value={newClassroomId}
                  onChange={(e) => setNewClassroomId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الرقم الأكاديمي</label>
                <input
                  type="text"
                  value={newStudentIdNumber}
                  onChange={(e) => setNewStudentIdNumber(e.target.value)}
                  placeholder="STD-2026-001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {newRole === 'TEACHER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المسار والتخصص الأكاديمي</label>
              <input
                type="text"
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                placeholder="مثال: معلم الرياضيات والفيزياء"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddUserOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20"
            >
              حفظ الحساب
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={loadData}
        classrooms={classrooms}
      />

      {/* CSV Import Modal with Preview */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={loadData}
        classrooms={classrooms}
      />
    </div>
  );
};
