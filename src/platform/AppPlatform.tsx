import React, { useState } from 'react';
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

interface AppPlatformProps {
  onExitPlatform: () => void;
}

const PlatformRoot: React.FC<AppPlatformProps> = ({ onExitPlatform }) => {
  const { user, isAuthenticated, isLoading } = usePlatformAuth();
  const [currentPage, setCurrentPage] = useState<PlatformPage>('dashboard');

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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (user.role === 'ORG_ADMIN' || user.role === 'SUPER_ADMIN') {
          return <AdminDashboardPage onNavigate={setCurrentPage} />;
        }
        if (user.role === 'TEACHER') {
          return <TeacherDashboardPage onNavigate={setCurrentPage} />;
        }
        if (user.role === 'PARENT') {
          return <ParentDashboardPage onNavigate={setCurrentPage} />;
        }
        return <StudentDashboardPage onNavigate={setCurrentPage} />;

      case 'ai-assistant':
        return <AIAssistantPage />;

      case 'users':
        return <UsersManagementPage />;

      case 'students':
        return <StudentsPage />;

      case 'academic':
        return <AcademicStructurePage />;

      case 'courses':
        return <CoursesListPage onNavigate={setCurrentPage} />;

      case 'lessons':
        return <LessonsManagerPage />;

      case 'library':
        return <DigitalLibraryPage />;

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
            onBackToLogin={() => setCurrentPage('dashboard')}
            onSuccess={() => setCurrentPage('dashboard')}
          />
        );

      default:
        return <AdminDashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <PlatformLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
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
