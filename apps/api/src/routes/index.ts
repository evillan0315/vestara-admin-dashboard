import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import oauthRouter from './oauth.js';
import usersRouter from './users.js';
import settingsRouter from './settings.js';
import auditLogsRouter from './audit-logs.js';
import profileRouter from './profile.js';
import organizationsRouter from './organizations.js';
import uploadRouter from './upload.js';

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
router.use('/profile', profileRouter);
router.use('/organizations', organizationsRouter);
router.use('/upload', uploadRouter);

export default router;
