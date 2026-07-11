import { Role, UserStatus } from "@prisma/client";

export interface User {
  id: string;

  email: string | null;
  phone: string;

  passwordHash: string | null;

  role: Role;
  status: UserStatus;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Register request
 */
export interface RegisterDTO {
  email: string;
  phone: string;
  password: string;
}

/**
 * Login request
 * identifier can be email or phone
 */
export interface LoginDTO {
  identifier: string;
  password: string;
}

/**
 * User returned to clients
 */
export type SafeUser = Omit<User, "passwordHash">;

/**
 * Login/Register response
 */
export interface AuthResponse {
  token: string;
  user: SafeUser;
}

/**
 * JWT payload
 */
export interface JwtPayload {
  userId: string;
  email: string;
}