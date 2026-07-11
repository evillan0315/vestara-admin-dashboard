import { type Request, type Response, type NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HTTP_STATUS } from '@vestara/constants';
import { formatValidationError } from '@vestara/validation';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Express middleware that validates the specified request part against a Zod schema.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      // Replace with parsed (coerced/defaulted) values
      (req as unknown as Record<string, unknown>)[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(HTTP_STATUS.UNPROCESSABLE).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: formatValidationError(error),
          },
        });
        return;
      }
      next(error);
    }
  };
}
