import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Organization, AuthProviderType } from '../types';
import { platformApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantSlug: string;
  error: string | null;
  login: (emailOrIdentifier: string, password?: string, tenantSlug?: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    tenantSlug?: string;
  }) => Promise<{ verificationSent?: boolean }>;
  sendPhoneOtp: (phone: string, purpose?: string) => Promise<{ cooldownSeconds: number; devOtpCode?: string }>;
  verifyPhoneOtp: (phone: string, code: string, fullName?: string) => Promise<void>;
  loginWithGoogleCredential: (credential: string) => Promise<void>;
  startGoogleOAuthPopup: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ devResetToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendEmailVerification: () => Promise<{ alreadyVerified?: boolean; devVerificationToken?: string }>;
  confirmEmailVerification: (token: string) => Promise<void>;
  linkProvider: (provider: AuthProviderType, data: { credential?: string; code?: string; phone?: string }) => Promise<void>;
  unlinkProvider: (provider: AuthProviderType) => Promise<void>;
  switchOrganization: (organizationId?: string, organizationSlug?: string) => Promise<void>;
  updateProfile: (data: { fullName?: string; avatarUrl?: string; phone?: string }) => Promise<void>;
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

  const refreshUser = useCallback(async () => {
    try {
      const res = await platformApi.getMe();
      if (res.success) {
        setUser(res.user);
        setOrganization(res.organization);
      }
    } catch {
      // Ignore
    }
  }, []);

  const initAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformApi.getMe();
      if (res.success) {
        setUser(res.user);
        setOrganization(res.organization);
      }
    } catch {
      // In dev environment only, provide fallback if needed
      if (process.env.NODE_ENV !== 'production') {
        try {
          const demoRes = await platformApi.demoSwitch('admin', tenantSlug);
          setUser(demoRes.user);
          setOrganization(demoRes.organization);
        } catch {
          setUser(null);
          setOrganization(null);
        }
      } else {
        setUser(null);
        setOrganization(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Listen for OAuth Popup PostMessage responses
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, user: authUser, organization: authOrg } = event.data;
        if (token && authUser) {
          platformApi.setToken(token);
          if (authOrg?.slug) platformApi.setTenantSlug(authOrg.slug);
          setUser(authUser);
          setOrganization(authOrg);
        }
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setError(event.data.error || 'فشل تسجيل الدخول بواسطة Google');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const login = async (emailOrIdentifier: string, password?: string, slug?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.login(emailOrIdentifier, password, slug);
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

  const register = async (data: {
    fullName: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    tenantSlug?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.register(data);
      setUser(res.user);
      setOrganization(res.organization);
      if (res.organization?.slug) setTenantSlugState(res.organization.slug);
      return { verificationSent: res.verificationSent };
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneOtp = async (phone: string, purpose?: string) => {
    setError(null);
    try {
      const res = await platformApi.sendPhoneOtp(phone, purpose);
      return { cooldownSeconds: res.cooldownSeconds, devOtpCode: res.devOtpCode };
    } catch (err: any) {
      setError(err.message || 'فشل إرسال رمز التحقق');
      throw err;
    }
  };

  const verifyPhoneOtp = async (phone: string, code: string, fullName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.verifyPhoneOtp(phone, code, fullName, tenantSlug);
      setUser(res.user);
      setOrganization(res.organization);
      if (res.organization?.slug) setTenantSlugState(res.organization.slug);
    } catch (err: any) {
      setError(err.message || 'فشل التحقق من الرمز');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.verifyGoogleCredential(credential, tenantSlug);
      setUser(res.user);
      setOrganization(res.organization);
      if (res.organization?.slug) setTenantSlugState(res.organization.slug);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول بحساب Google');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startGoogleOAuthPopup = async () => {
    try {
      const { url } = await platformApi.getGoogleAuthUrl(tenantSlug);
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        url,
        'google_oauth_popup',
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );
    } catch (err: any) {
      setError(err.message || 'تعذر فتح نافذة Google OAuth');
      throw err;
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      const res = await platformApi.forgotPassword(email);
      return { devResetToken: res.devResetToken };
    } catch (err: any) {
      setError(err.message || 'فشل إرسال طلب استعادة كلمة المرور');
      throw err;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    try {
      await platformApi.resetPassword(token, newPassword);
    } catch (err: any) {
      setError(err.message || 'فشل تحديث كلمة المرور');
      throw err;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setError(null);
    try {
      const res = await platformApi.changePassword(currentPassword, newPassword);
      if (res.user) setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'فشل تغيير كلمة المرور');
      throw err;
    }
  };

  const sendEmailVerification = async () => {
    setError(null);
    try {
      const res = await platformApi.sendEmailVerification();
      return { alreadyVerified: res.alreadyVerified, devVerificationToken: res.devVerificationToken };
    } catch (err: any) {
      setError(err.message || 'فشل إرسال تأكيد البريد');
      throw err;
    }
  };

  const confirmEmailVerification = async (token: string) => {
    setError(null);
    try {
      const res = await platformApi.confirmEmailVerification(token);
      if (res.user) setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'فشل تأكيد البريد الإلكتروني');
      throw err;
    }
  };

  const linkProvider = async (provider: AuthProviderType, data: { credential?: string; code?: string; phone?: string }) => {
    setError(null);
    try {
      if (provider === 'google') {
        const res = await platformApi.linkGoogle({ credential: data.credential, code: data.code });
        if (res.user) setUser(res.user);
      } else if (provider === 'phone' && data.phone && data.code) {
        const res = await platformApi.linkPhone(data.phone, data.code);
        if (res.user) setUser(res.user);
      }
    } catch (err: any) {
      setError(err.message || `فشل ربط ${provider}`);
      throw err;
    }
  };

  const unlinkProvider = async (provider: AuthProviderType) => {
    setError(null);
    try {
      const res = await platformApi.unlinkProvider(provider);
      if (res.user) setUser(res.user);
    } catch (err: any) {
      setError(err.message || `فشل إلغاء ربط ${provider}`);
      throw err;
    }
  };

  const switchOrganization = async (organizationId?: string, organizationSlug?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await platformApi.switchOrganization(organizationId, organizationSlug);
      setOrganization(res.organization);
      setTenantSlugState(res.organization.slug);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'فشل التبديل إلى المؤسسة التعليمية');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { fullName?: string; avatarUrl?: string; phone?: string }) => {
    setError(null);
    try {
      const res = await platformApi.updateProfile(data);
      if (res.user) setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'فشل تحديث البيانات الشخصية');
      throw err;
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
    if (process.env.NODE_ENV !== 'production') {
      demoSwitch('admin', slug);
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
        register,
        sendPhoneOtp,
        verifyPhoneOtp,
        loginWithGoogleCredential,
        startGoogleOAuthPopup,
        forgotPassword,
        resetPassword,
        changePassword,
        sendEmailVerification,
        confirmEmailVerification,
        linkProvider,
        unlinkProvider,
        switchOrganization,
        updateProfile,
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
