import React, { useState } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { PlatformPage } from '../types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Award,
  FileText,
  Settings,
  LogOut,
  Layers,
  Menu,
  X,
  Building2,
  UserCheck,
  ChevronDown,
  Globe,
  ExternalLink,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { Badge } from './Badge';
import { UserProfileModal } from './auth/UserProfileModal';

interface PlatformLayoutProps {
  currentPage: PlatformPage;
  onNavigate: (page: PlatformPage) => void;
  children: React.ReactNode;
  onExitPlatform: () => void;
}

export const PlatformLayout: React.FC<PlatformLayoutProps> = ({
  currentPage,
  onNavigate,
  children,
  onExitPlatform,
}) => {
  const { user, organization, logout, demoSwitch, setTenantSlug, tenantSlug } = usePlatformAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  if (!user || !organization) return <>{children}</>;

  const roleLabels = {
    SUPER_ADMIN: { ar: 'مشرف النظام', en: 'Super Admin', color: 'purple' as const },
    ORG_ADMIN: { ar: 'مدير المدرسة', en: 'School Principal', color: 'emerald' as const },
    TEACHER: { ar: 'معلم', en: 'Teacher', color: 'blue' as const },
    STUDENT: { ar: 'طالب', en: 'Student', color: 'amber' as const },
    PARENT: { ar: 'ولي أمر', en: 'Parent', color: 'slate' as const },
  };

  const currentRole = roleLabels[user.role] || roleLabels.STUDENT;

  // Role-based Nav items
  const navItems: { id: PlatformPage; label: string; icon: any; roles?: string[]; badge?: string }[] = [
    { id: 'dashboard', label: user.role === 'PARENT' ? 'بوابة ولي الأمر' : 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'مساعد رتقاء الذكي (AI)', icon: Sparkles, badge: 'جديد' },
    { id: 'courses', label: 'المقررات والمناهج', icon: BookOpen, roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT'] },
    { id: 'lessons', label: 'الدروس والمحتوى', icon: FileText, roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT'] },
    { id: 'assignments', label: 'الواجبات والتكليفات', icon: ClipboardCheck, roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT'] },
    { id: 'gradebook', label: user.role === 'STUDENT' ? 'سجل درجاتي' : (user.role === 'PARENT' ? 'سجل درجات الأبناء' : 'سجل الدرجات والتقييم'), icon: Award },
    { id: 'attendance', label: user.role === 'PARENT' ? 'سجل حضور الأبناء' : 'الحضور والغياب', icon: GraduationCap },
    { id: 'students', label: 'شؤون الطلاب وسجل SIS', icon: UserCheck, roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER'] },
    { id: 'users', label: 'إدارة المستخدمين والطلاب', icon: Users, roles: ['ORG_ADMIN', 'SUPER_ADMIN'] },
    { id: 'academic', label: 'الهيكل الأكاديمي والصفوف', icon: Layers, roles: ['ORG_ADMIN', 'SUPER_ADMIN'] },
    { id: 'settings', label: 'إعدادات المؤسسة وسجل الأمان', icon: Settings, roles: ['ORG_ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredNav = navItems.filter((item) => !item.roles || item.roles.includes(user.role));

  const handleNav = (page: PlatformPage) => {
    onNavigate(page);
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchPersona = (p: 'admin' | 'teacher' | 'student' | 'parent') => {
    demoSwitch(p, tenantSlug);
    setPersonaDropdownOpen(false);
  };

  const handleSwitchSchool = (slug: string) => {
    setTenantSlug(slug);
    setSchoolDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-950/80 border-e border-slate-800/80 backdrop-blur-2xl p-4 shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <span className="font-extrabold text-slate-950 text-lg tracking-tight">R</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">RTIQA</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                LMS
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">{organization.name}</span>
          </div>
        </div>

        {/* School Tenant Switcher */}
        <div className="relative mb-4 px-2">
          <button
            onClick={() => setSchoolDropdownOpen(!schoolDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs transition"
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate font-medium text-slate-200">{organization.name.split('(')[0]}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {schoolDropdownOpen && (
            <div className="absolute top-full left-2 right-2 mt-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-30 space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">عزل المؤسسات (Multi-Tenant)</div>
              <button
                onClick={() => handleSwitchSchool('horizon')}
                className={`w-full text-start p-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                  tenantSlug === 'horizon' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>مدرسة الأفق العالمية</span>
                {tenantSlug === 'horizon' && <span className="text-[10px]">نشط</span>}
              </button>
              <button
                onClick={() => handleSwitchSchool('elite')}
                className={`w-full text-start p-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                  tenantSlug === 'elite' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>مدارس النخبة النموذجية</span>
                {tenantSlug === 'elite' && <span className="text-[10px]">نشط</span>}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Persona Fast Switcher */}
        <div className="pt-4 border-t border-slate-800/80 mt-auto space-y-2">
          {/* Fast Switch Persona Button */}
          <div className="relative">
            <button
              onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 text-xs font-medium transition text-slate-300"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                تبديل الدور التجريبي
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {personaDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-30 space-y-1">
                <button
                  onClick={() => handleSwitchPersona('admin')}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    user.role === 'ORG_ADMIN' ? 'bg-emerald-500/15 text-emerald-300' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>مدير المدرسة (Admin)</span>
                  <Badge variant="emerald" size="sm">كامل الصلاحيات</Badge>
                </button>
                <button
                  onClick={() => handleSwitchPersona('teacher')}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    user.role === 'TEACHER' ? 'bg-blue-500/15 text-blue-300' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>معلم (Teacher)</span>
                  <Badge variant="blue" size="sm">تدريس وتقييم</Badge>
                </button>
                <button
                  onClick={() => handleSwitchPersona('student')}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    user.role === 'STUDENT' ? 'bg-amber-500/15 text-amber-300' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>طالب (Student)</span>
                  <Badge variant="amber" size="sm">تعلم وتسليم</Badge>
                </button>
                <button
                  onClick={() => handleSwitchPersona('parent')}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    user.role === 'PARENT' ? 'bg-purple-500/15 text-purple-300' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>ولي أمر (Parent)</span>
                  <Badge variant="purple" size="sm">متابعة الأبناء</Badge>
                </button>
              </div>
            )}
          </div>

          {/* Current User Info */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2.5 truncate text-start hover:opacity-80 transition flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-slate-200 truncate">{user.fullName}</span>
                <Badge variant={currentRole.color} size="sm">
                  {currentRole.ar}
                </Badge>
              </div>
            </button>
            <button
              onClick={logout}
              title="تسجيل الخروج"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Back to Marketing Site */}
          <button
            onClick={onExitPlatform}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition"
          >
            <ExternalLink className="w-3 h-3" />
            <span>العودة إلى الموقع التعريفي</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-100">
                  {navItems.find((n) => n.id === currentPage)?.label || 'المنصة التعليمية'}
                </h1>
                <Badge variant={currentRole.color} size="sm">
                  {currentRole.ar}
                </Badge>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {organization.name} &bull; السنة الأكاديمية 2026-2027
              </span>
            </div>
          </div>

          {/* Fast Top Actions */}
          <div className="flex items-center gap-2.5">
            {/* Persona Switch Pills for Easy Demo Testing */}
            <div className="hidden lg:flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <button
                onClick={() => handleSwitchPersona('admin')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  user.role === 'ORG_ADMIN' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                مدير
              </button>
              <button
                onClick={() => handleSwitchPersona('teacher')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  user.role === 'TEACHER' ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                معلم
              </button>
              <button
                onClick={() => handleSwitchPersona('student')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  user.role === 'STUDENT' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                طالب
              </button>
            </div>

            <button
              onClick={onExitPlatform}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">الموقع التعريفي</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-2xl p-6 overflow-y-auto space-y-4 pt-20 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100">{organization.name}</span>
              </div>
              <Badge variant={currentRole.color} size="sm">
                {currentRole.ar}
              </Badge>
            </div>

            {/* Persona Switch */}
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => handleSwitchPersona('admin')}
                className={`py-2 rounded-xl text-xs font-bold ${
                  user.role === 'ORG_ADMIN' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                مدير
              </button>
              <button
                onClick={() => handleSwitchPersona('teacher')}
                className={`py-2 rounded-xl text-xs font-bold ${
                  user.role === 'TEACHER' ? 'bg-blue-500 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                معلم
              </button>
              <button
                onClick={() => handleSwitchPersona('student')}
                className={`py-2 rounded-xl text-xs font-bold ${
                  user.role === 'STUDENT' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                طالب
              </button>
              <button
                onClick={() => handleSwitchPersona('parent')}
                className={`py-2 rounded-xl text-xs font-bold ${
                  user.role === 'PARENT' ? 'bg-purple-500 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                ولي أمر
              </button>
            </div>

            <nav className="space-y-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-slate-900/60 border border-slate-800/80 text-slate-200"
                  >
                    <Icon className="w-5 h-5 text-emerald-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold text-xs"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        )}

        {/* Page Main View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* User Profile & Security Modal */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};
