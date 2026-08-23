import express from 'express';
import type { PlatformRequest } from '../auth.ts';
import { requireAuth, requireRoles } from '../auth.ts';
import { db } from '../db.ts';
import { NotificationService } from '../notificationService.ts';

export const notificationRouter = express.Router();

// All notification routes require authenticated session
notificationRouter.use(requireAuth);

/**
 * GET /api/v1/notifications
 * Get notifications for current user with optional filters
 */
notificationRouter.get('/', (req: PlatformRequest, res: express.Response) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const items = db.getNotifications(req.organization!.id, req.user!.id, {
      unreadOnly,
      limit,
    });

    const unreadCount = db.getUnreadNotificationCount(req.organization!.id, req.user!.id);

    res.json({
      success: true,
      data: items,
      meta: {
        total: items.length,
        unreadCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'NOTIFICATIONS_FETCH_ERROR',
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Fast endpoint for UI badge
 */
notificationRouter.get('/unread-count', (req: PlatformRequest, res: express.Response) => {
  try {
    const count = db.getUnreadNotificationCount(req.organization!.id, req.user!.id);
    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'COUNT_FETCH_ERROR',
    });
  }
});

/**
 * POST /api/v1/notifications/:id/read
 * Mark a single notification as read
 */
notificationRouter.post('/:id/read', (req: PlatformRequest, res: express.Response) => {
  try {
    const updated = db.markNotificationAsRead(req.params.id, req.organization!.id, req.user!.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'NOTIFICATION_NOT_FOUND',
      });
    }

    const unreadCount = db.getUnreadNotificationCount(req.organization!.id, req.user!.id);
    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'MARK_READ_ERROR',
    });
  }
});

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read for current user
 */
notificationRouter.post('/read-all', (req: PlatformRequest, res: express.Response) => {
  try {
    const count = db.markAllNotificationsAsRead(req.organization!.id, req.user!.id);
    res.json({
      success: true,
      data: { updatedCount: count, unreadCount: 0 },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'MARK_ALL_READ_ERROR',
    });
  }
});

/**
 * POST /api/v1/notifications/broadcast
 * Send announcement or notice to targeted audience (School Admins & Teachers)
 */
notificationRouter.post(
  '/broadcast',
  requireRoles(['SUPER_ADMIN', 'ORG_ADMIN', 'TEACHER']),
  async (req: PlatformRequest, res: express.Response) => {
    try {
      const { title, body, targetRole, classroomId, channels } = req.body;

      if (!title || !body) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Title and body are required for broadcast.',
        });
      }

      // If teacher, can only broadcast to classrooms they teach
      if (req.user!.role === 'TEACHER' && classroomId) {
        const myCourses = db.getCourses(req.organization!.id, req.user!.id);
        const myClassroomIds = myCourses.map((c) => c.classroomId);
        if (!myClassroomIds.includes(classroomId)) {
          return res.status(403).json({
            success: false,
            error: 'ACCESS_DENIED',
            message: 'You can only broadcast to classrooms assigned to your courses.',
          });
        }
      }

      const result = await NotificationService.broadcast({
        organizationId: req.organization!.id,
        targetRole,
        classroomId,
        title,
        body,
        channels: channels || ['IN_APP'],
      });

      res.json({
        success: true,
        data: {
          recipientsCount: result.count,
          message: `تم إرسال الإشعار بنجاح إلى ${result.count} مستلم.`,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'BROADCAST_ERROR',
      });
    }
  }
);
