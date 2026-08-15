import express from 'express';
import { platformAuthMiddleware } from './auth';
import { db } from './db';
import { authRouter } from './routes/authRoutes';
import { academicRouter } from './routes/academicRoutes';
import { userRouter } from './routes/userRoutes';
import { courseRouter } from './routes/courseRoutes';
import { lessonRouter } from './routes/lessonRoutes';
import { assignmentRouter } from './routes/assignmentRoutes';
import { attendanceRouter } from './routes/attendanceRoutes';
import { gradebookRouter } from './routes/gradebookRoutes';
import { dashboardRouter } from './routes/dashboardRoutes';
import { aiRouter } from './routes/aiRoutes';

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

// Mount modular sub-routers
platformApiRouter.use('/auth', authRouter);
platformApiRouter.use('/academic', academicRouter);
platformApiRouter.use('/users', userRouter);
platformApiRouter.use('/courses', courseRouter);
platformApiRouter.use('/lessons', lessonRouter);
platformApiRouter.use('/assignments', assignmentRouter);
platformApiRouter.use('/attendance', attendanceRouter);
platformApiRouter.use('/gradebook', gradebookRouter);
platformApiRouter.use('/dashboard', dashboardRouter);
platformApiRouter.use('/ai', aiRouter);

