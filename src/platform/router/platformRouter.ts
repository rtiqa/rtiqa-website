import { PlatformPage, UserRole } from '../types';

export interface PlatformRoute {
  isPlatform: boolean;
  page: PlatformPage;
  subPage?: string;
  id?: string;
  query: Record<string, string>;
  fullPath: string;
}

const VALID_PLATFORM_PAGES: PlatformPage[] = [
  'dashboard',
  'onboarding',
  'users',
  'students',
  'academic',
  'courses',
  'course-detail',
  'lessons',
  'library',
  'assignments',
  'gradebook',
  'attendance',
  'ai-assistant',
  'settings',
];

// Role-based route authorization matrix
export const ROLE_ROUTE_PERMISSIONS: Record<PlatformPage, UserRole[]> = {
  dashboard: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  'ai-assistant': ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  courses: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT'],
  'course-detail': ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT'],
  lessons: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT'],
  library: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  assignments: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT'],
  gradebook: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  attendance: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'],
  students: ['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER'],
  users: ['SUPER_ADMIN', 'ORG_ADMIN'],
  academic: ['SUPER_ADMIN', 'ORG_ADMIN'],
  settings: ['SUPER_ADMIN', 'ORG_ADMIN'],
  onboarding: ['SUPER_ADMIN', 'ORG_ADMIN', 'PENDING', 'GUEST'],
};

export function isRouteAllowedForRole(page: PlatformPage, role?: UserRole): boolean {
  if (!role) return false;
  if (role === 'PENDING' || role === 'GUEST') {
    return page === 'onboarding';
  }
  const allowed = ROLE_ROUTE_PERMISSIONS[page];
  if (!allowed) return true;
  return allowed.includes(role);
}

/**
 * Parses query string into key-value map
 */
export function parseQueryString(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  if (!search) return query;
  const normalized = search.startsWith('?') ? search.substring(1) : search;
  const pairs = normalized.split('&');
  for (const pair of pairs) {
    if (!pair) continue;
    const [k, v] = pair.split('=');
    if (k) {
      query[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
    }
  }
  return query;
}

/**
 * Parses the current window.location or arbitrary URL path into a typed PlatformRoute
 */
export function parsePlatformRoute(loc?: { pathname: string; hash: string; search: string }): PlatformRoute {
  const targetLoc = loc || (typeof window !== 'undefined' ? window.location : { pathname: '/', hash: '', search: '' });
  
  let raw = targetLoc.pathname || '/';
  let hash = targetLoc.hash ? targetLoc.hash.replace(/^#\/?/, '') : '';
  const query = parseQueryString(targetLoc.search);

  // Check if hash contains platform route, e.g. #platform/library/resource/123
  if (hash.startsWith('platform') || hash.startsWith('app')) {
    raw = '/' + hash;
  }

  // Strip leading slash
  const cleaned = raw.startsWith('/') ? raw.substring(1) : raw;
  const segments = cleaned.split('/').filter(Boolean);

  const isPlatform = segments[0] === 'platform' || segments[0] === 'app';
  if (!isPlatform) {
    return {
      isPlatform: false,
      page: 'dashboard',
      query,
      fullPath: raw,
    };
  }

  // segments[0] is 'platform' or 'app'
  const pageCandidate = segments[1] as PlatformPage | undefined;
  let page: PlatformPage = 'dashboard';
  let subPage: string | undefined = undefined;
  let id: string | undefined = undefined;

  if (pageCandidate && VALID_PLATFORM_PAGES.includes(pageCandidate)) {
    page = pageCandidate;

    if (segments.length >= 4) {
      // e.g. /platform/library/resource/res_123 or /platform/courses/lesson/les_123
      subPage = segments[2];
      id = segments[3];
    } else if (segments.length === 3) {
      // e.g. /platform/courses/crs_123 or /platform/library/res_123
      id = segments[2];
    }
  }

  return {
    isPlatform: true,
    page,
    subPage,
    id,
    query,
    fullPath: raw,
  };
}

/**
 * Builds standard clean URL path for a platform destination
 */
export function buildPlatformUrl(
  page: PlatformPage,
  detail?: { subPage?: string; id?: string; query?: Record<string, string> }
): string {
  let path = `/platform/${page}`;
  if (detail?.subPage && detail?.id) {
    path += `/${encodeURIComponent(detail.subPage)}/${encodeURIComponent(detail.id)}`;
  } else if (detail?.id) {
    path += `/${encodeURIComponent(detail.id)}`;
  }

  if (detail?.query && Object.keys(detail.query).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(detail.query)) {
      if (v) searchParams.set(k, v);
    }
    const qs = searchParams.toString();
    if (qs) path += `?${qs}`;
  }

  return path;
}

/**
 * Dispatches a custom routing event so React components react immediately
 */
export function dispatchPlatformRouteChange(route: PlatformRoute): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('rtiqa-platform-route-change', { detail: route });
    window.dispatchEvent(event);
  }
}

/**
 * Navigates to a platform destination updating browser history
 */
export function navigateToPlatform(
  page: PlatformPage,
  detail?: { subPage?: string; id?: string; query?: Record<string, string> },
  options?: { replace?: boolean; scroll?: boolean }
): void {
  if (typeof window === 'undefined') return;

  const url = buildPlatformUrl(page, detail);
  const route: PlatformRoute = {
    isPlatform: true,
    page,
    subPage: detail?.subPage,
    id: detail?.id,
    query: detail?.query || {},
    fullPath: url,
  };

  try {
    if (options?.replace) {
      window.history.replaceState({ rtiqaRoute: route }, '', url);
    } else {
      window.history.pushState({ rtiqaRoute: route }, '', url);
    }
  } catch {
    // Fallback if sandboxed iframe blocks pushState
    window.location.hash = url.replace(/^\//, '');
  }

  dispatchPlatformRouteChange(route);

  if (options?.scroll !== false) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

const INTENDED_DESTINATION_KEY = 'rtiqa_intended_path';

export function setIntendedDestination(path: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(INTENDED_DESTINATION_KEY, path);
  } catch {
    // Ignore storage restrictions
  }
}

export function getIntendedDestination(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(INTENDED_DESTINATION_KEY);
  } catch {
    return null;
  }
}

export function clearIntendedDestination(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(INTENDED_DESTINATION_KEY);
  } catch {
    // Ignore storage restrictions
  }
}
