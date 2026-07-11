import { z } from "zod";

/**
 * Request Schemas
 */

export const registerBodySchema = z.object({
  email: z.email().optional(),
  phone: z
    .string()
    .min(10)
    .describe("User phone number")
    .meta({
      example: "+639171234567",
    }),

  password: z
    .string()
    .min(8)
    .describe("Account password")
    .meta({
      example: "StrongPassword123",
    }),
});

export const loginBodySchema = z.object({
  identifier: z
    .string()
    .describe("Email address or phone number")
    .meta({
      example: "john@example.com",
    }),

  password: z
    .string()
    .min(8)
    .meta({
      example: "StrongPassword123",
    }),
});

/**
 * Enums
 */

export const roleSchema = z.enum([
  "USER",
  "ADMIN",
]);

export const userStatusSchema = z.enum([
  "ACTIVE",
  "SUSPENDED",
  "PENDING",
]);

/**
 * User Response Schema
 */

export const userSchema = z.object({
  id: z.string(),

  email: z.string().nullable(),

  phone: z.string(),

  role: roleSchema,

  status: userStatusSchema,

  createdAt: z.date(),

  updatedAt: z.date(),
});

/**
 * Auth Responses
 */

export const authResponseSchema = z.object({
  token: z.string(),

  user: userSchema,
});

export const meResponseSchema = userSchema;

/**
 * Error Response
 */

export const errorResponseSchema = z.object({
  error: z.string(),
});

/**
 * JWT Payload
 */

export const jwtPayloadSchema = z.object({
  userId: z.string(),
  email: z.string(),
});

/**
 * DTO Types
 */

export type RegisterDTO = z.infer<
  typeof registerBodySchema
>;

export type LoginDTO = z.infer<
  typeof loginBodySchema
>;

export type UserResponse = z.infer<
  typeof userSchema
>;

export type AuthResponse = z.infer<
  typeof authResponseSchema
>;

export type JwtPayload = z.infer<
  typeof jwtPayloadSchema
>;