import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Request ID middleware for distributed tracing.
 *
 * Generates a unique `X-Request-Id` for every incoming request (unless the
 * client already provides one — e.g. from an API gateway or load balancer).
 * The ID is attached to the response header and to `req` for downstream
 * logging, error correlation, and audit trail linkage.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.get('X-Request-Id') as string | undefined) || randomUUID();

  // Expose to route handlers and logging middleware.
  (req as Request & { requestId: string }).requestId = id;

  // Return to the client so they can correlate responses with requests.
  res.setHeader('X-Request-Id', id);

  next();
}
