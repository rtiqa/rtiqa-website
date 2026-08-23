import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server';
import { db } from '../server/platform/db';
import { closePostgresPool } from '../src/db/postgres';
import { NotificationService } from '../server/platform/notificationService';

describe('Phase 4: Intelligent Interactive School Platform Tests', () => {
  let server: any;
  let baseUrl: string;

  before(async () => {
    process.env.NODE_ENV = 'test';
    const app = await createApp();

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closePostgresPool();
  });

  beforeEach(() => {
    db.resetData();
  });

  // Helper for requests
  const request = async (
    path: string,
    options: { method?: string; headers?: Record<string, string>; body?: any } = {}
  ) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  const getAuthHeader = async (email: string, orgSlug = 'horizon') => {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email, tenantSlug: orgSlug },
    });
    const token = loginRes.data?.token || loginRes.data?.data?.token;
    return {
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': orgSlug,
    };
  };

  describe('1. Notifications & Multi-Channel Dispatch', () => {
    test('User can fetch notifications and get unread count', async () => {
      const headers = await getAuthHeader('admin@horizon.edu.sa');

      const countRes = await request('/notifications/unread-count', { headers });
      assert.equal(countRes.status, 200);
      assert.equal(countRes.data.success, true);
      assert(typeof countRes.data.data.unreadCount === 'number');

      const listRes = await request('/notifications', { headers });
      assert.equal(listRes.status, 200);
      assert.equal(listRes.data.success, true);
      assert(Array.isArray(listRes.data.data));
    });

    test('User can mark a notification as read and mark all as read', async () => {
      const headers = await getAuthHeader('admin@horizon.edu.sa');

      // Send a test notification first to ensure at least one exists
      await NotificationService.send({
        organizationId: 'org_horizon_001',
        recipientId: 'usr_horizon_admin',
        recipientRole: 'ORG_ADMIN',
        type: 'ANNOUNCEMENT',
        title: 'إشعار تجريبي',
        body: 'محتوى الإشعار التجريبي',
        channels: ['IN_APP'],
      });

      const listRes = await request('/notifications', { headers });
      assert(listRes.data.data.length > 0);
      const firstNotif = listRes.data.data[0];

      // Mark single read
      const markRes = await request(`/notifications/${firstNotif.id}/read`, {
        method: 'POST',
        headers,
      });
      assert.equal(markRes.status, 200);
      assert.equal(markRes.data.success, true);

      // Mark all read
      const markAllRes = await request('/notifications/read-all', {
        method: 'POST',
        headers,
      });
      assert.equal(markAllRes.status, 200);
      assert.equal(markAllRes.data.success, true);
      assert.equal(markAllRes.data.data.unreadCount, 0);
    });

    test('Admin/Teacher can broadcast notifications to specific target roles', async () => {
      const adminHeaders = await getAuthHeader('admin@horizon.edu.sa');

      const broadcastRes = await request('/notifications/broadcast', {
        method: 'POST',
        headers: adminHeaders,
        body: {
          title: 'تعميم إداري عاجل',
          body: 'نحيطكم علماً بأن موعد الاختبارات الشهرية سيبدأ الأسبوع القادم.',
          targetRole: 'STUDENT',
          channels: ['IN_APP', 'EMAIL'],
        },
      });

      assert.equal(broadcastRes.status, 200);
      assert.equal(broadcastRes.data.success, true);
      assert(broadcastRes.data.data.recipientsCount > 0);
    });

    test('Student cannot broadcast notifications (403 Forbidden)', async () => {
      const studentHeaders = await getAuthHeader('student@horizon.edu.sa');

      const broadcastRes = await request('/notifications/broadcast', {
        method: 'POST',
        headers: studentHeaders,
        body: {
          title: 'محاولة إرسال غير مصرحة',
          body: 'اختبار الصلاحيات',
        },
      });

      assert.equal(broadcastRes.status, 403);
    });
  });

  describe('2. Phase 4 AI Educational Assistant Endpoints', () => {
    test('Parent can query /api/v1/ai/parent-advisor for student progress and advice', async () => {
      const parentHeaders = await getAuthHeader('parent@horizon.edu.sa');

      const res = await request('/ai/parent-advisor', {
        method: 'POST',
        headers: parentHeaders,
        body: {
          question: 'كيف يمكنني مساعدة ابني في تحسين مهاراته الأكاديمية وتنظيم المذاكرة؟',
          includePerformance: true,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert(typeof res.data.data.text === 'string');
      assert(res.data.data.text.length > 0);
    });

    test('Teacher can generate a 5-stage lesson plan via /api/v1/ai/lesson-plan', async () => {
      const teacherHeaders = await getAuthHeader('teacher@horizon.edu.sa');

      const res = await request('/ai/lesson-plan', {
        method: 'POST',
        headers: teacherHeaders,
        body: {
          topic: 'مقدمة في المصفوفات والعمليات الجبرية',
          durationMinutes: 45,
          learningObjectives: 'فهم مفهوم المصفوفة وإجراء عملية الجمع والضرب القياسي',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert(typeof res.data.data.text === 'string');
      assert(res.data.data.text.length > 0);
    });

    test('Teacher can generate formative rubric and feedback via /api/v1/ai/assignment-feedback', async () => {
      const teacherHeaders = await getAuthHeader('teacher@horizon.edu.sa');

      const res = await request('/ai/assignment-feedback', {
        method: 'POST',
        headers: teacherHeaders,
        body: {
          assignmentTitle: 'واجب المصفوفات',
          studentAnswer: 'تم إيجاد ناتج جمع المصفوفتين A و B بجمع العناصر المتناظرة',
          score: 18,
          maxScore: 20,
          rubricCriteria: 'الدقة الرياضية ووضوح خطوات الحل',
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert(typeof res.data.data.text === 'string');
      assert(res.data.data.text.length > 0);
    });

    test('Student can request personalized recommendations via /api/v1/ai/recommendations', async () => {
      const studentHeaders = await getAuthHeader('student@horizon.edu.sa');

      const res = await request('/ai/recommendations', {
        method: 'POST',
        headers: studentHeaders,
        body: {},
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);
      assert(typeof res.data.data.text === 'string');
      assert(res.data.data.text.length > 0);
    });
  });

  describe('3. Academic Analytics & Early Warning Engine', () => {
    test('Admin/Teacher can fetch academic analytics summary and early warning indicators', async () => {
      const adminHeaders = await getAuthHeader('admin@horizon.edu.sa');

      const res = await request('/dashboard/analytics', {
        headers: adminHeaders,
      });

      assert.equal(res.status, 200);
      assert.equal(res.data.success, true);

      const analytics = res.data.data;
      assert(typeof analytics.averageGpa === 'number');
      assert(typeof analytics.totalStudentsCount === 'number');
      assert(typeof analytics.atRiskCount === 'number');
      assert(Array.isArray(analytics.atRiskStudents));
      assert(Array.isArray(analytics.coursePerformance));
      assert(Array.isArray(analytics.topPerformers));
    });

    test('Student cannot access school-wide analytics (403 Forbidden)', async () => {
      const studentHeaders = await getAuthHeader('student@horizon.edu.sa');

      const res = await request('/dashboard/analytics', {
        headers: studentHeaders,
      });

      assert.equal(res.status, 403);
    });
  });
});
