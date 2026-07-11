import { type Response } from 'express';
import type { ApiResponse, PaginationMeta } from '@vestara/types';
import { HTTP_STATUS } from '@vestara/constants';

/**
 * Send a success response.
 */
export function sendSuccess<T>(res: Response, data?: T, statusCode: number = HTTP_STATUS.OK): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(body);
}

/**
 * Send a success response with pagination metadata.
 */
export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  statusCode: number = HTTP_STATUS.OK,
): void {
  const body: ApiResponse<T[]> = {
    success: true,
    data: items,
    meta: pagination,
  };
  res.status(statusCode).json(body);
}

/**
 * Send a created response (201).
 */
export function sendCreated<T>(res: Response, data?: T): void {
  sendSuccess(res, data, HTTP_STATUS.CREATED);
}

/**
 * Send a no-content response (204).
 */
export function sendNoContent(res: Response): void {
  res.status(HTTP_STATUS.NO_CONTENT).send();
}

/**
 * Send an error response.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  res.status(statusCode).json(body);
}
