import express from 'express';
import { platformAuthMiddleware, requireOrg } from './auth.ts';
import { db } from './db.ts';
import { authRouter } from './routes/authRoutes.ts';
import { academicRouter } from './routes/academicRoutes.ts';
import { userRouter } from './routes/userRoutes.ts';
import { courseRouter } from './routes/courseRoutes.ts';
import { lessonRouter } from './routes/lessonRoutes.ts';
import { assignmentRouter } from './routes/assignmentRoutes.ts';
import { attendanceRouter } from './routes/attendanceRoutes.ts';
import { gradebookRouter } from './routes/gradebookRoutes.ts';
import { dashboardRouter } from './routes/dashboardRoutes.ts';
import { aiRouter } from './routes/aiRoutes.ts';
import { studentRouter } from './routes/studentRoutes.ts';
import { storageRouter } from './routes/storageRoutes.ts';
import { notificationRouter } from './routes/notificationRoutes.ts';
import { libraryRouter } from './routes/libraryRoutes.ts';
import { getStorageService } from './storage/service.ts';
import { getMigrationStatus } from '../../src/db/migrate.ts';

export const platformApiRouter = express.Router();

// Health check with PostgreSQL engine & storage status (accessible publicly)
platformApiRouter.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.getEngineStatus();
    const migrationStatus = dbStatus.connected ? await getMigrationStatus() : { migrated: false };
    const storageHealth = getStorageService().getHealth();

    const isHealthy = process.env.NODE_ENV === 'production'
      ? dbStatus.connected && migrationStatus.migrated && storageHealth.status === 'READY'
      : true;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      service: 'rtiqa-platform-api',
      version: '1.0.0',
      database: {
        ...dbStatus,
        migration: migrationStatus,
      },
      storage: storageHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: (err as Error).message });
  }
});

// Apply platform authentication and multi-tenant context extraction
platformApiRouter.use(platformAuthMiddleware);

// Auth router handles identity, login, onboarding, invitations, school creation
platformApiRouter.use('/auth', authRouter);

// Tenant-scoped sub-routers strictly require verified organization membership
platformApiRouter.use('/academic', requireOrg, academicRouter);
platformApiRouter.use('/users', requireOrg, userRouter);
platformApiRouter.use('/courses', requireOrg, courseRouter);
platformApiRouter.use('/lessons', requireOrg, lessonRouter);
platformApiRouter.use('/assignments', requireOrg, assignmentRouter);
platformApiRouter.use('/attendance', requireOrg, attendanceRouter);
platformApiRouter.use('/gradebook', requireOrg, gradebookRouter);
platformApiRouter.use('/dashboard', requireOrg, dashboardRouter);
platformApiRouter.use('/ai', requireOrg, aiRouter);
platformApiRouter.use('/students', requireOrg, studentRouter);
platformApiRouter.use('/storage', requireOrg, storageRouter);
platformApiRouter.use('/notifications', requireOrg, notificationRouter);
platformApiRouter.use('/library', requireOrg, libraryRouter);



