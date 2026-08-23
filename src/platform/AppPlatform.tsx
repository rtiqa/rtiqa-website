import React, { useEffect } from 'react';
import { PlatformAuthProvider, usePlatformAuth } from './context/PlatformAuthContext';
import { PlatformPage } from './types';
import { PlatformLayout } from './components/PlatformLayout';
import { PlatformLoginPage } from './pages/PlatformLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { TeacherDashboardPage } from './pages/TeacherDashboardPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { AcademicStructurePage } from './pages/AcademicStructurePage';
import { CoursesListPage } from './pages/CoursesListPage';
import { LessonsManagerPage } from './pages/LessonsManagerPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { GradebookPage } from './pages/GradebookPage';
import { AttendancePage } from './pages/AttendancePage';
import { SchoolSettingsPage } from './pages/SchoolSettingsPage';
import { OnboardingWizardPage } from './pages/OnboardingWizardPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { StudentsPage } from './pages/StudentsPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { DigitalLibraryPage } from './pages/DigitalLibraryPage';
import { usePlatformRouter } from './router/usePlatformRouter';
import { parsePlatformRoute } from './router/platformRouter';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';

interface AppPlatformProps {
  onExitPlatform: () => void;
}

const PlatformRoot: React.FC<AppPlatformProps> = ({ onExitPlatform }) => {
  const { user, isAuthenticated, isLoading } = usePlatformAuth();
  const {
    currentPage,
    subPage,
    detailId,
    navigate,
    isAllowed,
    getIntendedDestination,
    clearIntendedDestination,
    setIntendedDestination,
  } = usePlatformRouter(user?.role);

  // Preserve intended destination if user hits platform URL unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      if (currentPath && currentPath.includes('platform') && !currentPath.includes('login')) {
        setIntendedDestination(currentPath);
      }
    }
  }, [isLoading, isAuthenticated, setIntendedDestination]);

  // Restore and redirect to intended destination upon successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      const intended = getIntendedDestination();
      if (intended) {
        clearIntendedDestination();
        const parsed = parsePlatformRoute({ pathname: intended, hash: '', search: '' });
        if (parsed.isPlatform && parsed.page) {
          navigate(
            parsed.page,
            { subPage: parsed.subPage, id: parsed.id, query: parsed.query },
            { replace: true }
          );
        }
      }
    }
  }, [isAuthenticated, user, clearIntendedDestination, navigate, getIntendedDestination]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060b18] flex flex-col items-center justify-center space-y-4 text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-pulse">
          <span className="text-xl font-black text-emerald-400">R</span>
        </div>
        <p className="text-xs font-semibold text-slate-400">جاري تهيئة منصة ارتقاء التعليمية الذكية...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <PlatformLoginPage onBackToMarketing={onExitPlatform} />;
  }

  // Role-Based Authorization Guard
  if (!isAllowed(currentPage)) {
    return (
      <PlatformLayout
        currentPage={currentPage}
        onNavigate={(page) => navigate(page)}
        onExitPlatform={onExitPlatform}
      >
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-extrabold text-white">غير مصرح بالدخول لهذه الصفحة</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              عذراً، نوع حسابك الحالي ({user.role}) لا يمتلك الصلاحيات الإدارية الكافية للوصول إلى هذه الوحدة.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigate('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>العودة للوحة الرئيسية</span>
            </button>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (user.role === 'ORG_ADMIN' || user.role === 'SUPER_ADMIN') {
          return <AdminDashboardPage onNavigate={(page) => navigate(page)} />;
        }
        if (user.role === 'TEACHER') {
          return <TeacherDashboardPage onNavigate={(page) => navigate(page)} />;
        }
        if (user.role === 'PARENT') {
          return <ParentDashboardPage onNavigate={(page) => navigate(page)} />;
        }
        return <StudentDashboardPage onNavigate={(page) => navigate(page)} />;

      case 'ai-assistant':
        return <AIAssistantPage />;

      case 'users':
        return <UsersManagementPage />;

      case 'students':
        return <StudentsPage />;

      case 'academic':
        return <AcademicStructurePage />;

      case 'courses':
        return <CoursesListPage onNavigate={(page) => navigate(page)} />;

      case 'lessons':
        return <LessonsManagerPage />;

      case 'library':
        return (
          <DigitalLibraryPage
            initialResourceId={subPage === 'resource' ? detailId : undefined}
            onNavigate={(page, detail) => navigate(page, detail)}
          />
        );

      case 'assignments':
        return <AssignmentsPage />;

      case 'gradebook':
        return <GradebookPage />;

      case 'attendance':
        return <AttendancePage />;

      case 'settings':
        return <SchoolSettingsPage />;

      case 'onboarding':
        return (
          <OnboardingWizardPage
            onBackToLogin={() => navigate('dashboard')}
            onSuccess={() => navigate('dashboard')}
          />
        );

      default:
        return <AdminDashboardPage onNavigate={(page) => navigate(page)} />;
    }
  };

  return (
    <PlatformLayout
      currentPage={currentPage}
      onNavigate={(page) => navigate(page)}
      onExitPlatform={onExitPlatform}
    >
      {renderCurrentPage()}
    </PlatformLayout>
  );
};

export const AppPlatform: React.FC<AppPlatformProps> = (props) => {
  return (
    <PlatformAuthProvider>
      <PlatformRoot {...props} />
    </PlatformAuthProvider>
  );
};
export default AppPlatform;
