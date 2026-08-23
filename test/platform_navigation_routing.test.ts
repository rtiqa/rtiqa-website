import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePlatformRoute,
  buildPlatformUrl,
  parseQueryString,
  isRouteAllowedForRole,
  ROLE_ROUTE_PERMISSIONS,
} from '../src/platform/router/platformRouter';
import { PlatformPage, UserRole } from '../src/platform/types';

describe('Platform Navigation & Routing Suite', () => {
  describe('1. Platform Route Parser', () => {
    test('parses root platform path to dashboard', () => {
      const route = parsePlatformRoute({ pathname: '/platform', hash: '', search: '' });
      assert.equal(route.isPlatform, true);
      assert.equal(route.page, 'dashboard');
      assert.equal(route.subPage, undefined);
      assert.equal(route.id, undefined);
    });

    test('parses standard platform page paths', () => {
      const pages: PlatformPage[] = [
        'courses',
        'lessons',
        'library',
        'assignments',
        'gradebook',
        'attendance',
        'users',
        'students',
        'academic',
        'settings',
        'ai-assistant',
      ];

      for (const p of pages) {
        const route = parsePlatformRoute({ pathname: `/platform/${p}`, hash: '', search: '' });
        assert.equal(route.isPlatform, true, `Expected isPlatform for ${p}`);
        assert.equal(route.page, p, `Expected page to match ${p}`);
      }
    });

    test('parses single ID sub-routes (e.g. /platform/courses/crs_101)', () => {
      const route = parsePlatformRoute({ pathname: '/platform/courses/crs_101', hash: '', search: '' });
      assert.equal(route.isPlatform, true);
      assert.equal(route.page, 'courses');
      assert.equal(route.id, 'crs_101');
      assert.equal(route.subPage, undefined);
    });

    test('parses deep sub-resource routes (e.g. /platform/library/resource/res_505)', () => {
      const route = parsePlatformRoute({ pathname: '/platform/library/resource/res_505', hash: '', search: '' });
      assert.equal(route.isPlatform, true);
      assert.equal(route.page, 'library');
      assert.equal(route.subPage, 'resource');
      assert.equal(route.id, 'res_505');
    });

    test('parses deep curriculum unit routes (e.g. /platform/library/unit/unit_707)', () => {
      const route = parsePlatformRoute({ pathname: '/platform/library/unit/unit_707', hash: '', search: '' });
      assert.equal(route.isPlatform, true);
      assert.equal(route.page, 'library');
      assert.equal(route.subPage, 'unit');
      assert.equal(route.id, 'unit_707');
    });

    test('parses hash-based platform URLs for legacy fallback', () => {
      const route = parsePlatformRoute({ pathname: '/', hash: '#platform/library/resource/res_888', search: '' });
      assert.equal(route.isPlatform, true);
      assert.equal(route.page, 'library');
      assert.equal(route.subPage, 'resource');
      assert.equal(route.id, 'res_888');
    });

    test('parses query parameters accurately', () => {
      const route = parsePlatformRoute({
        pathname: '/platform/library',
        hash: '',
        search: '?tenant=horizon&tab=CURRICULUM_UNITS&q=%D8%B1%D9%8A%D8%A7%D8%8Code%D9%8A%D8%A7%D8%AA',
      });
      assert.equal(route.isPlatform, true);
      assert.equal(route.query.tenant, 'horizon');
      assert.equal(route.query.tab, 'CURRICULUM_UNITS');
      assert.ok(route.query.q);
    });

    test('returns non-platform for marketing site paths', () => {
      const route = parsePlatformRoute({ pathname: '/products', hash: '', search: '' });
      assert.equal(route.isPlatform, false);
    });
  });

  describe('2. URL Builder', () => {
    test('builds standard page URL', () => {
      const url = buildPlatformUrl('library');
      assert.equal(url, '/platform/library');
    });

    test('builds detail ID URL', () => {
      const url = buildPlatformUrl('courses', { id: 'crs_math_101' });
      assert.equal(url, '/platform/courses/crs_math_101');
    });

    test('builds nested subPage and ID URL', () => {
      const url = buildPlatformUrl('library', { subPage: 'resource', id: 'res_phys_99' });
      assert.equal(url, '/platform/library/resource/res_phys_99');
    });

    test('builds URL with encoded query string', () => {
      const url = buildPlatformUrl('courses', {
        id: 'crs_101',
        query: { tenant: 'horizon', sort: 'name' },
      });
      assert.ok(url.startsWith('/platform/courses/crs_101?'));
      assert.ok(url.includes('tenant=horizon'));
      assert.ok(url.includes('sort=name'));
    });
  });

  describe('3. Role-Based Route Authorization Matrix', () => {
    test('ORG_ADMIN and SUPER_ADMIN can access all routes', () => {
      const allPages: PlatformPage[] = [
        'dashboard',
        'courses',
        'lessons',
        'library',
        'assignments',
        'gradebook',
        'attendance',
        'students',
        'users',
        'academic',
        'settings',
        'onboarding',
        'ai-assistant',
      ];

      for (const p of allPages) {
        assert.equal(isRouteAllowedForRole(p, 'ORG_ADMIN'), true, `Admin should access ${p}`);
        assert.equal(isRouteAllowedForRole(p, 'SUPER_ADMIN'), true, `SuperAdmin should access ${p}`);
      }
    });

    test('TEACHER can access instructional modules but not institution settings or user management', () => {
      assert.equal(isRouteAllowedForRole('dashboard', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('courses', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('lessons', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('library', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('assignments', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('gradebook', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('attendance', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('students', 'TEACHER'), true);
      assert.equal(isRouteAllowedForRole('ai-assistant', 'TEACHER'), true);

      // Blocked
      assert.equal(isRouteAllowedForRole('users', 'TEACHER'), false);
      assert.equal(isRouteAllowedForRole('academic', 'TEACHER'), false);
      assert.equal(isRouteAllowedForRole('settings', 'TEACHER'), false);
      assert.equal(isRouteAllowedForRole('onboarding', 'TEACHER'), false);
    });

    test('STUDENT is restricted to learning portal and blocked from administrative tools', () => {
      assert.equal(isRouteAllowedForRole('dashboard', 'STUDENT'), true);
      assert.equal(isRouteAllowedForRole('courses', 'STUDENT'), true);
      assert.equal(isRouteAllowedForRole('lessons', 'STUDENT'), true);
      assert.equal(isRouteAllowedForRole('library', 'STUDENT'), true);
      assert.equal(isRouteAllowedForRole('assignments', 'STUDENT'), true);
      assert.equal(isRouteAllowedForRole('gradebook', 'STUDENT'), true);
      assert.equal(isRouteAllowedForRole('attendance', 'STUDENT'), true);
      assert.equal(isRouteAllowedForRole('ai-assistant', 'STUDENT'), true);

      // Strictly Blocked
      assert.equal(isRouteAllowedForRole('students', 'STUDENT'), false);
      assert.equal(isRouteAllowedForRole('users', 'STUDENT'), false);
      assert.equal(isRouteAllowedForRole('academic', 'STUDENT'), false);
      assert.equal(isRouteAllowedForRole('settings', 'STUDENT'), false);
      assert.equal(isRouteAllowedForRole('onboarding', 'STUDENT'), false);
    });

    test('PARENT is restricted to family oversight portal', () => {
      assert.equal(isRouteAllowedForRole('dashboard', 'PARENT'), true);
      assert.equal(isRouteAllowedForRole('library', 'PARENT'), true);
      assert.equal(isRouteAllowedForRole('gradebook', 'PARENT'), true);
      assert.equal(isRouteAllowedForRole('attendance', 'PARENT'), true);
      assert.equal(isRouteAllowedForRole('ai-assistant', 'PARENT'), true);

      // Blocked
      assert.equal(isRouteAllowedForRole('courses', 'PARENT'), false);
      assert.equal(isRouteAllowedForRole('lessons', 'PARENT'), false);
      assert.equal(isRouteAllowedForRole('students', 'PARENT'), false);
      assert.equal(isRouteAllowedForRole('users', 'PARENT'), false);
      assert.equal(isRouteAllowedForRole('academic', 'PARENT'), false);
      assert.equal(isRouteAllowedForRole('settings', 'PARENT'), false);
    });
  });
});
