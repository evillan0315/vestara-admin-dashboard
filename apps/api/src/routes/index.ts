import { Router } from 'express';
import healthRouter from './health.js';
import authRouter from './auth.js';
import oauthRouter from './oauth.js';

const router = Router();

// Mount feature routes
router.use(healthRouter);

// Auth routes
router.use('/auth', authRouter);

// OAuth routes (Google, GitHub)
router.use('/auth', oauthRouter);

// Future:
// router.use('/users', usersRouter);
// router.use('/settings', settingsRouter);
// router.use('/audit-logs', auditRouter);

export default router;
