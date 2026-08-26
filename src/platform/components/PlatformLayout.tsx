import React, { useState } from 'react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { PlatformPage } from '../types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BookOpenCheck,
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
import { NotificationCenter } from './NotificationCenter';

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

  if (!user) return <>{children}</>;

  const currentOrg = organization || {
    id: 'org_main',
    name: 'منصة ارتقاء التعليمية الذكية',
    slug: tenantSlug || 'horizon',
    domain: 'rtiqa.com',
  };

  const roleLabels = {
    SUPER_ADMIN: { ar: 'مشرف النظام العام', en: 'Super Admin', color: 'purple' as const },
    ORG_ADMIN: { ar: 'مدير المدرسة', en: 'School Principal', color: 'emerald' as const },
    TEACHER: { ar: 'معلم', en: 'Teacher', color: 'blue' as const },
    STUDENT: { ar: 'طالب', en: 'Student', color: 'amber' as const },
    PARENT: { ar: 'ولي أمر', en: 'Parent', color: 'slate' as const },
    PENDING: { ar: 'حساب شخصي', en: 'Personal Account', color: 'slate' as const },
    GUEST: { ar: 'حساب زائر', en: 'Guest', color: 'slate' as const },
  };

  const currentRole = roleLabels[user.role as keyof typeof roleLabels] || roleLabels.STUDENT;

  // Role-based Nav items
  const navItems: { id: PlatformPage; label: string; icon: any; roles?: string[]; badge?: string }[] = [
    { id: 'dashboard', label: user.role === 'PARENT' ? 'بوابة ولي الأمر' : 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'مساعد ارتقاء الذكي (AI)', icon: Sparkles, badge: 'جديد' },
    { id: 'courses', label: 'المقررات والمناهج', icon: BookOpen, roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT'] },
    { id: 'lessons', label: 'الدروس والوحدات', icon: FileText, roles: ['ORG_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT'] },
    { id: 'library', label: 'المكتبة التعليمية الرقمية', icon: BookOpenCheck, badge: '5.1' },
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

  const handleLogout = async () => {
    setMobileSidebarOpen(false);
    await logout();
  };

  React.useEffect(() => {
    const handlePopState = () => {
      if (mobileSidebarOpen) setMobileSidebarOpen(false);
      if (profileModalOpen) setProfileModalOpen(false);
      if (personaDropdownOpen) setPersonaDropdownOpen(false);
      if (schoolDropdownOpen) setSchoolDropdownOpen(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileSidebarOpen, profileModalOpen, personaDropdownOpen, schoolDropdownOpen]);

  const handleSwitchPersona = (p: 'admin' | 'teacher' | 'student' | 'parent') => {
    demoSwitch(p, tenantSlug);
    setPersonaDropdownOpen(false);
  };

  const handleSwitchSchool = (slug: string) => {
    setTenantSlug(slug);
    setSchoolDropdownOpen(false);
    if (process.env.NODE_ENV !== 'production' && user) {
      const roleMap: Record<string, 'admin' | 'teacher' | 'student' | 'parent'> = {
        SUPER_ADMIN: 'admin',
        ORG_ADMIN: 'admin',
        TEACHER: 'teacher',
        STUDENT: 'student',
        PARENT: 'parent',
      };
      demoSwitch(roleMap[user.role] || 'admin', slug);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30 selection:text-emerald-200" dir="rtl">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-950/90 border-l border-slate-800/80 backdrop-blur-2xl p-4 shrink-0 shadow-2xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="font-extrabold text-slate-950 text-lg tracking-tight">R</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">RTIQA</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                LMS
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block truncate max-w-[160px]" title={currentOrg.name}>
              {currentOrg.name}
            </span>
          </div>
        </div>

        {/* School Tenant Switcher */}
        <div className="relative mb-3 px-1">
          <button
            onClick={() => setSchoolDropdownOpen(!schoolDropdownOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs transition"
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate font-medium text-slate-200">{currentOrg.name.split('(')[0]}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {schoolDropdownOpen && (
            <div className="absolute top-full left-1 right-1 mt-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-30 space-y-1">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">عزل المؤسسات (Multi-Tenant)</div>
              <button
                onClick={() => handleSwitchSchool('horizon')}
                className={`w-full text-start p-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                  tenantSlug === 'horizon' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>مدرسة الأفق العالمية</span>
                {tenantSlug === 'horizon' && <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">نشط</span>}
              </button>
              <button
                onClick={() => handleSwitchSchool('elite')}
                className={`w-full text-start p-2 rounded-xl text-xs font-medium flex items-center justify-between ${
                  tenantSlug === 'elite' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>مدارس النخبة النموذجية</span>
                {tenantSlug === 'elite' && <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded">نشط</span>}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-1 overflow-y-auto custom-scrollbar">
          {filteredNav.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Action Buttons */}
        <div className="pt-3 border-t border-slate-800/80 mt-auto space-y-2">
          {/* Current User Info */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/70 border border-slate-800">
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="flex items-center gap-2.5 truncate text-start hover:opacity-80 transition flex-1 min-w-0"
              title="تعديل الملف الشخصي"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <div className="truncate min-w-0">
                <span className="block text-xs font-bold text-slate-200 truncate">{user.fullName}</span>
                <Badge variant={currentRole.color} size="sm">
                  {currentRole.ar}
                </Badge>
              </div>
            </button>
            <button
              onClick={handleLogout}
              title="تسجيل الخروج من المنصة"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Logout & Exit platform actions */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
            <button
              onClick={onExitPlatform}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="العودة إلى الموقع التعريفي"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-950/85 border-b border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white shrink-0"
              aria-label="القائمة الجانبية"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-base font-bold text-slate-100 truncate">
                  {navItems.find((n) => n.id === currentPage)?.label || 'لوحة القيادة'}
                </h1>
                <Badge variant={currentRole.color} size="sm">
                  {currentRole.ar}
                </Badge>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline truncate max-w-xs">
                {currentOrg.name} &bull; 2026-2027
              </span>
            </div>
          </div>

          {/* Fast Top Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Notification Center */}
            <NotificationCenter userRole={user.role} onNavigate={handleNav} />

            {/* Current user trigger on header */}
            <button
              onClick={() => setProfileModalOpen(true)}
              className="hidden sm:flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs transition"
              title="الملف الشخصي"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-emerald-400 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
              </div>
              <span className="font-semibold text-slate-200 max-w-[110px] truncate">{user.fullName.split(' ')[0]}</span>
            </button>

            {/* Prominent Header Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>

            {/* Return to Public Website */}
            <button
              onClick={onExitPlatform}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
              title="العودة للموقع التعريفي"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">الموقع التعريفي</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-2xl animate-in fade-in" dir="rtl">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center">
                  <span className="font-extrabold text-slate-950 text-base">R</span>
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm">{currentOrg.name}</div>
                  <Badge variant={currentRole.color} size="sm">
                    {currentRole.ar}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Details in Mobile Drawer */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.fullName.charAt(0)
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{user.fullName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email || user.role}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setProfileModalOpen(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 border border-slate-700 font-medium"
              >
                الملف الشخصي
              </button>
            </div>

            {/* Navigation items list */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
              <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                أقسام ووحدات المنصة
              </div>
              {filteredNav.map((item) => {
                const isActive = currentPage === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-900/50 border border-slate-800/60 text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions for Mobile */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
              <button
                onClick={onExitPlatform}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>العودة إلى الموقع التعريفي</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/25 transition shadow-lg shadow-rose-950/20"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج من المنصة</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Main View Container */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>

      {/* User Profile & Security Modal */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};
