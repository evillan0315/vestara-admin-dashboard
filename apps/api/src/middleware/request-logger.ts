import { type Request, type Response, type NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url } = req;
  const requestId = (req as Request & { requestId?: string }).requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    logger.info(
      {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('content-length') || 0,
        ...(requestId ? { requestId } : {}),
      },
      `${method} ${url} ${statusCode} ${duration}ms`,
    );
  });

  next();
}
