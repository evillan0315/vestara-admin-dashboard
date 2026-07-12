import { Router, type Request, type Response } from 'express';
import { UserRole } from '@vestara/types';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { getWebSocketManager } from '../websocket/index.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

/**
 * Capability probe for the real-time endpoint. Returns whether Socket.IO is
 * actually served on this deployment. Public on purpose so the client can
 * decide whether to open a socket. `isAttached` is true whenever the Socket.IO
 * server has been bound to the HTTP server — which it is on both the long-running
 * Node host and on Vercel (the function attaches Socket.IO at load time).
 */
router.get('/', (_req: Request, res: Response) => {
  const available = getWebSocketManager().isAttached;
  sendSuccess(res, {
    available,
    transport: available ? 'socket.io' : 'none',
  });
});

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
