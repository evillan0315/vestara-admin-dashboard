import { type Request, type Response } from 'express';
import { sendError } from '../utils/response.js';
import { HTTP_STATUS, ERROR_CODES } from '@vestara/constants';

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(
    res,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.NOT_FOUND,
    'The requested resource was not found',
  );
}
