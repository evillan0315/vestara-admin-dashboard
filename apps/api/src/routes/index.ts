import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import oauthRouter from './oauth.js';
import usersRouter from './users.js';
import settingsRouter from './settings.js';
import auditLogsRouter from './audit-logs.js';

const router = Router();

// Mount feature routes
router.use(healthRouter);

// Auth routes
router.use('/auth', authRouter);

// OAuth routes (Google, GitHub)
router.use('/auth', oauthRouter);

// Protected API routes
router.use('/users', usersRouter);
router.use('/settings', settingsRouter);
router.use('/audit-logs', auditLogsRouter);

export default router;
