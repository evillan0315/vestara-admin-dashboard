import { Router, type Request, type Response } from 'express';
import { UserRole } from '@vestara/types';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { getWebSocketManager } from '../websocket/index.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * Real-time connection statistics (connection count, throughput, per-org
 * presence counts). Restricted to admins. Always available, even when the
 * WebSocket server is not attached (returns zeroed stats).
 */
router.get(
  '/status',
  authenticate,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  (_req: Request, res: Response) => {
    sendSuccess(res, getWebSocketManager().getStats());
  },
);

export default router;
