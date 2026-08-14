import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { platformApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantSlug: string;
  error: string | null;
  login: (email: string, password?: string, tenantSlug?: string) => Promise<void>;
  demoSwitch: (persona: 'admin' | 'teacher' | 'teacher2' | 'student' | 'student2', tenantSlug?: string) => Promise<void>;
  registerSchool: (data: {
    schoolName: string;
    slug: string;
    legalName?: string;
    adminName: string;
    adminEmail: string;
    password?: string;
    countryCode?: string;
  }) => Promise<void>;
  acceptInvitation: (data: { code: string; fullName?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  setTenantSlug: (slug: string) => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const PlatformAuthContext = createContext<AuthContextType | undefined>(undefined);

export const PlatformAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [tenantSlug, setTenantSlugState] = useState<string>(platformApi.getTenantSlug());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.getMe();
      if (res.success) {
        setUser(res.user);
        setOrganization(res.organization);
      }
    } catch {
      // If token expired or invalid, auto fallback to demo admin
      try {
        const demoRes = await platformApi.demoSwitch('admin', tenantSlug);
        setUser(demoRes.user);
        setOrganization(demoRes.organization);
      } catch {
        setUser(null);
        setOrganization(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password?: string, slug?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.login(email, password, slug);
      setUser(res.user);
      setOrganization(res.organization);
      if (res.organization?.slug) setTenantSlugState(res.organization.slug);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const demoSwitch = async (persona: 'admin' | 'teacher' | 'teacher2' | 'student' | 'student2', slug?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.demoSwitch(persona, slug);
      setUser(res.user);
      setOrganization(res.organization);
      if (res.organization?.slug) setTenantSlugState(res.organization.slug);
    } catch (err: any) {
      setError(err.message || 'فشل تبديل الحساب التجريبي');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerSchool = async (data: {
    schoolName: string;
    slug: string;
    legalName?: string;
    adminName: string;
    adminEmail: string;
    password?: string;
    countryCode?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.registerSchool(data);
      setUser(res.user);
      setOrganization(res.organization);
      setTenantSlugState(res.organization.slug);
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء المدرسة');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async (data: { code: string; fullName?: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.acceptInvitation(data);
      setUser(res.user);
      setOrganization(res.organization);
      setTenantSlugState(res.organization.slug);
    } catch (err: any) {
      setError(err.message || 'فشل قبول الدعوة');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await platformApi.logout();
    } finally {
      setUser(null);
      setOrganization(null);
      setIsLoading(false);
    }
  };

  const setTenantSlug = (slug: string) => {
    platformApi.setTenantSlug(slug);
    setTenantSlugState(slug);
    demoSwitch('admin', slug);
  };

  const refreshUser = async () => {
    try {
      const res = await platformApi.getMe();
      if (res.success) {
        setUser(res.user);
        setOrganization(res.organization);
      }
    } catch {
      // Ignore
    }
  };

  const clearError = () => setError(null);

  return (
    <PlatformAuthContext.Provider
      value={{
        user,
        organization,
        isLoading,
        isAuthenticated: Boolean(user),
        tenantSlug,
        error,
        login,
        demoSwitch,
        registerSchool,
        acceptInvitation,
        logout,
        setTenantSlug,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
};

export const usePlatformAuth = () => {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  }
  return context;
};
