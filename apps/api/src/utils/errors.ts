import { HTTP_STATUS, ERROR_CODES } from '@vestara/constants';

/**
 * Base application error with status code and error code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(
    message = 'Bad request',
    code: string = ERROR_CODES.INVALID_INPUT,
    details?: unknown,
  ) {
    super(message, HTTP_STATUS.BAD_REQUEST, code, details);
    this.name = 'BadRequestError';
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(
    message = 'Authentication required',
    code: string = ERROR_CODES.TOKEN_INVALID,
    details?: unknown,
  ) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(
    message = 'Insufficient permissions',
    code: string = ERROR_CODES.FORBIDDEN,
    details?: unknown,
  ) {
    super(message, HTTP_STATUS.FORBIDDEN, code, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(
    message = 'Resource not found',
    code: string = ERROR_CODES.NOT_FOUND,
    details?: unknown,
  ) {
    super(message, HTTP_STATUS.NOT_FOUND, code, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(
    message = 'Resource already exists',
    code: string = ERROR_CODES.CONFLICT,
    details?: unknown,
  ) {
    super(message, HTTP_STATUS.CONFLICT, code, details);
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE, ERROR_CODES.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }
}

/**
 * 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(
    message = 'Too many requests, please try again later',
    code: string = ERROR_CODES.RATE_LIMITED,
  ) {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS, code);
    this.name = 'RateLimitError';
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalError extends AppError {
  constructor(
    message = 'Internal server error',
    code: string = ERROR_CODES.INTERNAL_ERROR,
    details?: unknown,
  ) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, code, details);
    this.name = 'InternalError';
  }
}

// Create a convenience namespace for backward compatibility
export const errors = {
  Conflict: ConflictError,
  Unauthorized: UnauthorizedError,
};
