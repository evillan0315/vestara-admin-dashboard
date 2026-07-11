import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { HTTP_STATUS, ERROR_CODES } from '@vestara/constants';
import { formatValidationError } from '@vestara/validation';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    sendError(
      res,
      HTTP_STATUS.UNPROCESSABLE,
      ERROR_CODES.VALIDATION_ERROR,
      'Validation failed',
      formatValidationError(err),
    );
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, code: err.code, statusCode: err.statusCode }, err.message);
    }
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Unknown errors
  logger.error({ err }, 'Unhandled error');

  sendError(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
  );
}
