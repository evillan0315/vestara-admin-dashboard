import type { UserRole } from '@vestara/types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: UserRole;
        organizationId: string;
      };
    }
  }
}

export {};
