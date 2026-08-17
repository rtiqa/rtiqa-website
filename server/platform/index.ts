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

export const platformApiRouter = express.Router();

// Health check with PostgreSQL engine status (accessible publicly)
platformApiRouter.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.getEngineStatus();
    res.json({
      status: 'ok',
      service: 'rtiqa-platform-api',
      version: '1.0.0',
      database: dbStatus,
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


