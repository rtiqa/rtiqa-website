import { useState, useEffect, useCallback } from 'react';
import {
  PlatformRoute,
  parsePlatformRoute,
  navigateToPlatform,
  buildPlatformUrl,
  setIntendedDestination,
  getIntendedDestination,
  clearIntendedDestination,
  isRouteAllowedForRole,
} from './platformRouter';
import { PlatformPage, UserRole } from '../types';

export function usePlatformRouter(userRole?: UserRole) {
  const [currentRoute, setCurrentRoute] = useState<PlatformRoute>(() => parsePlatformRoute());

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parsePlatformRoute();
      setCurrentRoute(parsed);
    };

    const handleCustomRoute = (e: Event) => {
      const customEvent = e as CustomEvent<PlatformRoute>;
      if (customEvent.detail) {
        setCurrentRoute(customEvent.detail);
      } else {
        setCurrentRoute(parsePlatformRoute());
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    window.addEventListener('rtiqa-platform-route-change', handleCustomRoute);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('rtiqa-platform-route-change', handleCustomRoute);
    };
  }, []);

  const navigate = useCallback(
    (page: PlatformPage, detail?: { subPage?: string; id?: string; query?: Record<string, string> }, options?: { replace?: boolean; scroll?: boolean }) => {
      navigateToPlatform(page, detail, options);
    },
    []
  );

  const isAllowed = useCallback(
    (page: PlatformPage) => {
      return isRouteAllowedForRole(page, userRole);
    },
    [userRole]
  );

  return {
    currentRoute,
    currentPage: currentRoute.page,
    subPage: currentRoute.subPage,
    detailId: currentRoute.id,
    query: currentRoute.query,
    fullPath: currentRoute.fullPath,
    navigate,
    isAllowed,
    buildUrl: buildPlatformUrl,
    setIntendedDestination,
    getIntendedDestination,
    clearIntendedDestination,
  };
}
