import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { recordRequest } from '../utils/metrics.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url } = req;
  const requestId = (req as Request & { requestId?: string }).requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Record metrics for the metrics collector
    recordRequest(method, url, statusCode, duration);

    logger.info(
      {
        method,
        url,
        statusCode,
        duration,
        contentLength: res.get('content-length') || 0,
        ...(requestId ? { requestId } : {}),
      },
      `${method} ${url} ${statusCode} ${duration}ms`,
    );
  });

  next();
}
