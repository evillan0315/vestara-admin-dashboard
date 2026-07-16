import { Router } from 'express';
import { authRateLimiter, healthRateLimiter } from '../middleware/rate-limit.js';
import healthRouter from './health.js';
import authRouter from './auth.js';
import oauthRouter from './oauth.js';
import usersRouter from './users.js';
import settingsRouter from './settings.js';
import auditLogsRouter from './audit-logs.js';
import profileRouter from './profile.js';
import organizationsRouter from './organizations.js';
import uploadRouter from './upload.js';
import filesRouter from './files.js';
import chatRouter from './chat.js';
import docsRouter from './docs.js';
import reportsRouter from './reports.js';
import websocketRouter from './websocket.js';
import agentRouter from './agent.js';

const router = Router();

// Mount feature routes
router.use(healthRateLimiter);
router.use(healthRouter);

// Auth routes — strict brute-force protection (counts only failures).
router.use('/auth', authRateLimiter, authRouter);

// OAuth routes (Google, GitHub) — same strict limiter as auth.
router.use('/auth', authRateLimiter, oauthRouter);

// Protected API routes
router.use('/users', usersRouter);
router.use('/settings', settingsRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/profile', profileRouter);
router.use('/organizations', organizationsRouter);
router.use('/upload', uploadRouter);
router.use('/files', filesRouter);
router.use('/chat', chatRouter);
router.use('/reports', reportsRouter);
router.use('/integrations', agentRouter);
router.use('/ws', websocketRouter);

// Documentation
router.use('/docs', docsRouter);

export default router;
