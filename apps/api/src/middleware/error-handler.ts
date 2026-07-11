import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '@vestara/constants';
import { formatValidationError } from '@vestara/validation';
import { AuditAction } from '@vestara/types';
import { auditLogRepository } from '../repositories/index.js';

interface ApiErrorDetails {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Persist an API request error as an audit-log entry so it surfaces in the
 * System Logs view. Only errors for authenticated requests are recorded
 * (unauthenticated failures such as expired tokens carry no user context).
 * Failures here are swallowed — logging must never block the error response.
 */
async function logApiError(req: Request, err: Error, info: ApiErrorDetails): Promise<void> {
  const user = req.user;
  if (!user) return;

  const metadata: Record<string, unknown> = {
    statusCode: info.statusCode,
    code: info.code,
    message: info.message,
    method: req.method,
    path: req.path,
  };

  // Include the stack trace for server faults to aid debugging.
  if (info.statusCode >= 500 && err.stack) {
    metadata.stack = err.stack;
  }

  await auditLogRepository.create({
    action: AuditAction.ERROR,
    entity: 'api',
    entityId: req.path,
    userId: user.id,
    metadata,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

export async function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  let info: ApiErrorDetails;

  // Zod validation errors
  if (err instanceof ZodError) {
    info = {
      statusCode: HTTP_STATUS.UNPROCESSABLE,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      details: formatValidationError(err),
    };
  }
  // Application errors
  else if (err instanceof AppError) {
    info = {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    };
    if (err.statusCode >= 500) {
      logger.error({ err, code: err.code, statusCode: err.statusCode }, err.message);
    }
  }
  // Unknown errors
  else {
    info = {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
    };
    logger.error({ err }, 'Unhandled error');
  }

  await logApiError(req, err, info).catch(() => undefined);

  sendError(res, info.statusCode, info.code, info.message, info.details);
}
