# Vestara Admin API

> Express.js REST API powering the Vestara administration dashboard.

Base URL: `/api/v1`

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Standard Response Format](#standard-response-format)
- [Error Handling](#error-handling)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Protected Routes](#protected-routes)
    - [Users](#get-users)
    - [Settings](#settings)
    - [Audit Logs](#audit-logs)
- [Data Models](#data-models)
- [Enums](#enums)
- [Error Codes](#error-codes)
- [Architecture](#architecture)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Express.js 5 |
| Language | TypeScript (strict mode) |
| Database ORM | Prisma 7 (`prisma-client` generator with `PrismaPg` adapter) |
| Database | Prisma Postgres (hosted PostgreSQL) |
| Auth | JWT (access + refresh tokens) |
| Password Hashing | bcryptjs |
| Validation | Zod |
| Logging | Pino |
| Runtime | Node.js 22+ |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- Prisma Postgres (hosted, no local PostgreSQL required)
- Redis 8+

### Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# (Optional) Seed development data
pnpm prisma db seed
```

### Running

```bash
# Start API server only
pnpm dev:api

# Start all services (API + web)
pnpm dev
```

The API server starts at `http://localhost:5000` by default.

---

## Standard Response Format

All API responses follow a consistent envelope structure.

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Success with Pagination

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "details": [ ... ]
  }
}
```

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity (validation error) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Error Handling

Errors flow through a centralized error-handling middleware pipeline.

### Application Errors

Every application error extends `AppError` and carries a numeric HTTP status code, a machine-readable error code, and optional detail payload.

| Error Class | Default Status | Default Code |
|-------------|---------------|--------------|
| `BadRequestError` | 400 | `INVALID_INPUT` |
| `UnauthorizedError` | 401 | `TOKEN_INVALID` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| `ValidationError` | 422 | `VALIDATION_ERROR` |
| `RateLimitError` | 429 | `RATE_LIMITED` |
| `InternalError` | 500 | `INTERNAL_ERROR` |

### Validation Errors

When Zod validation fails, a 422 response is returned with per-field error details:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address",
        "code": "invalid_string"
      }
    ]
  }
}
```

---

## Authentication

The API uses **JWT bearer token authentication** with short-lived access tokens and long-lived refresh tokens.

### Token Format

- **Access Token**: Short-lived (default 15 minutes), sent in the `Authorization` header.
- **Refresh Token**: Long-lived (default 30 days), used to obtain new access tokens.

### Authenticating Requests

Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Token Payload

```json
{
  "id": "user-uuid",
  "type": "access",
  "iat": 1700000000,
  "exp": 1700000900
}
```

### Security Headers

Every response includes:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |

---

## Endpoints

### Health

#### `GET /health`

Returns the server health status. Does not require authentication.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "uptime": 12345.67,
    "environment": "development"
  }
}
```

---

### Auth

All auth endpoints are prefixed with `/auth`.

#### `POST /auth/register`

Register a new user account. Returns user details and authentication tokens.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Valid email address |
| `password` | string | yes | Min 8 chars, uppercase, lowercase, number |
| `firstName` | string | yes | 1-100 characters |
| `lastName` | string | yes | 1-100 characters |
| `role` | string | no | User role (default: `admin`) |

**Response `201`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "isActive": true,
      "avatarUrl": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt...",
      "refreshToken": "jwt...",
      "expiresIn": 3600
    }
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 422 | Invalid input fields |
| `USER_ALREADY_EXISTS` | 409 | Email already registered |

---

#### `POST /auth/login`

Authenticate with email and password. Returns user details and authentication tokens.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Registered email address |
| `password` | string | yes | Account password |
| `ipAddress` | string | no | Client IP (auto-detected if omitted) |
| `userAgent` | string | no | Client user agent |

**Response `200`**

Same shape as `/auth/register` response.

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 422 | Invalid input fields |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password |

---

#### `POST /auth/refresh`

Exchange a refresh token for a new access token and refresh token pair.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | yes | Valid refresh token |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "jwt...",
      "refreshToken": "jwt...",
      "expiresIn": 3600
    }
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `INVALID_INPUT` | 400 | Missing refresh token |
| `REFRESH_TOKEN_INVALID` | 401 | Invalid or revoked refresh token |
| `ACCOUNT_DISABLED` | 401 | User account is inactive |

---

#### `POST /auth/logout`

Revoke the refresh token and invalidate all sessions for the user.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | yes | ID of the user to log out |
| `refreshToken` | string | no | Specific refresh token to revoke |

**Response `200`**

```json
{
  "success": true
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `INVALID_INPUT` | 400 | Missing user ID |

---

#### `GET /auth/me`

Get the currently authenticated user's profile.

**Headers**

| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | yes | `Bearer <access_token>` |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "isActive": true,
      "avatarUrl": null,
      "lastLoginAt": "2025-01-01T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `TOKEN_INVALID` | 401 | Missing or invalid access token |
| `USER_INACTIVE` | 401 | User account is disabled |

---

### Protected Routes

All protected routes require an `Authorization: Bearer <access_token>` header and are only accessible to authenticated users. Some routes also require specific roles (RBAC).

#### `GET /users`

Returns a paginated, filterable list of users. Requires authentication.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `perPage` | number | 20 | Results per page (max 100) |
| `sortBy` | string | `createdAt` | Sort column |
| `sortOrder` | enum | `desc` | Sort direction (`asc`, `desc`) |
| `search` | string | — | Full-text search across name/email |
| `role` | string | — | Filter by role (`super_admin`, `admin`, `moderator`, `support`) |
| `isActive` | boolean | — | Filter by active/inactive status |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "isActive": true,
      "avatarUrl": null,
      "lastLoginAt": "2025-01-01T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `TOKEN_INVALID` | 401 | Missing or invalid access token |

---

#### `GET /users/:id`

Get a single user by ID. Requires authentication.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "isActive": true,
    "avatarUrl": null,
    "lastLoginAt": "2025-01-01T00:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `TOKEN_INVALID` | 401 | Missing or invalid access token |
| `NOT_FOUND` | 404 | User does not exist |

---

#### `POST /users`

Create a new user. Requires `super_admin` or `admin` role.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | yes | Valid email address |
| `password` | string | yes | Min 8 chars, uppercase, lowercase, number |
| `firstName` | string | yes | 1-100 characters |
| `lastName` | string | yes | 1-100 characters |
| `role` | string | no | User role (default: `admin`) |

**Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "isActive": true,
    "avatarUrl": null,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 422 | Invalid input fields |
| `USER_ALREADY_EXISTS` | 409 | Email already registered |
| `FORBIDDEN` | 403 | Insufficient role permissions |

---

#### `PUT /users/:id`

Update an existing user. Requires `super_admin` or `admin` role.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | no | Valid email address |
| `firstName` | string | no | 1-100 characters |
| `lastName` | string | no | 1-100 characters |
| `role` | string | no | User role |

**Response `200`**

Same shape as `POST /users` response.

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 422 | Invalid input fields |
| `NOT_FOUND` | 404 | User not found |
| `FORBIDDEN` | 403 | Insufficient role permissions |

---

#### `DELETE /users/:id`

Delete a user. Requires `super_admin` role.

**Response `200`**

```json
{
  "success": true,
  "data": { "message": "User deleted successfully" }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `NOT_FOUND` | 404 | User not found |
| `FORBIDDEN` | 403 | Only super_admin can delete users |

---

#### `PATCH /users/:id/status`

Toggle a user's active/inactive status. Requires `super_admin` or `admin` role.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | boolean | yes | New active status |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isActive": false,
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `NOT_FOUND` | 404 | User not found |
| `FORBIDDEN` | 403 | Cannot deactivate own account |

---

### Settings

All settings endpoints are prefixed with `/settings` and require authentication.

#### `GET /settings`

Returns a paginated list of system settings.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `perPage` | number | 20 | Results per page |
| `sortBy` | string | `key` | Sort column |
| `sortOrder` | enum | `asc` | Sort direction |
| `search` | string | — | Search by key |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "key": "platform_name",
      "value": "Vestara",
      "updatedBy": "user-uuid",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

#### `GET /settings/:key`

Get a single setting by its key.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "platform_name",
    "value": "Vestara",
    "updatedBy": "user-uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `NOT_FOUND` | 404 | Setting key not found |

---

#### `POST /settings`

Create a new system setting. Requires `super_admin` or `admin` role.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | yes | Unique setting key |
| `value` | object | yes | Setting value (JSON) |

**Response `201`**

Same shape as `GET /settings/:key` response.

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 422 | Invalid input |
| `ALREADY_EXISTS` | 409 | Setting key already exists |
| `FORBIDDEN` | 403 | Insufficient role permissions |

---

#### `PUT /settings/:key`

Update an existing setting. Requires `super_admin` or `admin` role.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | object | yes | New setting value (JSON) |

**Response `200`**

Same shape as `GET /settings/:key` response.

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `VALIDATION_ERROR` | 422 | Invalid input |
| `NOT_FOUND` | 404 | Setting key not found |
| `FORBIDDEN` | 403 | Insufficient role permissions |

---

#### `DELETE /settings/:key`

Delete a system setting. Requires `super_admin` role.

**Response `200`**

```json
{
  "success": true,
  "data": { "message": "Setting deleted successfully" }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `NOT_FOUND` | 404 | Setting key not found |
| `FORBIDDEN` | 403 | Only super_admin can delete settings |

---

### Audit Logs

All audit log endpoints are prefixed with `/audit-logs` and require `super_admin` or `admin` role.

#### `GET /audit-logs`

Returns a paginated, filterable list of audit log entries.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `perPage` | number | 20 | Results per page |
| `sortBy` | string | `createdAt` | Sort column |
| `sortOrder` | enum | `desc` | Sort direction |
| `action` | string | — | Filter by action (`login`, `logout`, `create`, `update`, `delete`, etc.) |
| `entity` | string | — | Filter by entity type (`user`, `setting`, `audit_log`) |
| `entityId` | string | — | Filter by affected entity ID |
| `userId` | string | — | Filter by acting user ID |
| `search` | string | — | Full-text search |
| `startDate` | string | — | ISO date filter (start range) |
| `endDate` | string | — | ISO date filter (end range) |

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "login",
      "entity": "user",
      "entityId": "user-uuid",
      "userId": "user-uuid",
      "userName": "John Doe",
      "metadata": { "ipAddress": "192.168.1.1" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

---

#### `GET /audit-logs/:id`

Get a single audit log entry by ID.

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "action": "login",
    "entity": "user",
    "entityId": "user-uuid",
    "userId": "user-uuid",
    "userName": "John Doe",
    "metadata": {},
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error Codes**

| Code | Status | Condition |
|------|--------|-----------|
| `NOT_FOUND` | 404 | Audit log entry not found |

---

## Data Models

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier |
| `email` | string | Email address (unique) |
| `firstName` | string | Given name |
| `lastName` | string | Family name |
| `role` | enum (UserRole) | Authorization role |
| `isActive` | boolean | Account active flag |
| `avatarUrl` | string \| null | Avatar image URL |
| `lastLoginAt` | string \| null | ISO timestamp of last login |
| `createdAt` | string | ISO timestamp of creation |
| `updatedAt` | string | ISO timestamp of last update |

### Auth Tokens

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT access token |
| `refreshToken` | string | JWT refresh token |
| `expiresIn` | number | Access token TTL (seconds) |

### Audit Log

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier |
| `action` | enum (AuditAction) | Performed action |
| `entity` | enum (EntityType) | Affected entity type |
| `entityId` | string | Affected entity ID |
| `userId` | string | Acting user ID |
| `userName` | string \| undefined | Acting user display name |
| `metadata` | object \| undefined | Action-specific payload |
| `ipAddress` | string \| undefined | Client IP |
| `userAgent` | string \| undefined | Client user agent |
| `createdAt` | string | ISO timestamp |

### System Setting

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (uuid) | Unique identifier |
| `key` | string | Setting key (unique) |
| `value` | object | Setting value (JSON) |
| `updatedBy` | string \| undefined | Last modifier user ID |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

---

## Enums

### UserRole

| Value | Description |
|-------|-------------|
| `super_admin` | Full system access |
| `admin` | Administrative access |
| `moderator` | Content moderation |
| `support` | Customer support |

### AuditAction

| Value | Description |
|-------|-------------|
| `login` | User login |
| `logout` | User logout |
| `create` | Resource creation |
| `update` | Resource update |
| `delete` | Resource deletion |
| `approve` | Approval action |
| `reject` | Rejection action |
| `suspend` | Account suspension |
| `activate` | Account activation |
| `password_change` | Password change |
| `settings_update` | Settings modification |
| `settings_delete` | Settings deletion |

### EntityType

| Value | Description |
|-------|-------------|
| `user` | User entity |
| `role` | Role entity |
| `setting` | System setting |
| `audit_log` | Audit log entry |

### SortOrder

| Value | Description |
|-------|-------------|
| `asc` | Ascending |
| `desc` | Descending |

---

## Error Codes

### Authentication

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email or password is incorrect |
| `TOKEN_EXPIRED` | Access token has expired |
| `TOKEN_INVALID` | Access token is malformed or invalid |
| `REFRESH_TOKEN_INVALID` | Refresh token is invalid or revoked |
| `ACCOUNT_DISABLED` | User account has been deactivated |
| `EMAIL_NOT_VERIFIED` | Email has not been verified |

### Authorization

| Code | Description |
|------|-------------|
| `FORBIDDEN` | Insufficient privileges |
| `INSUFFICIENT_PERMISSIONS` | Missing required permission |

### Validation

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request failed schema validation |
| `INVALID_INPUT` | Invalid or missing input data |

### Resource

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Requested resource does not exist |
| `ALREADY_EXISTS` | Resource already exists |
| `CONFLICT` | Resource conflict |

### User

| Code | Description |
|------|-------------|
| `USER_NOT_FOUND` | User not found |
| `USER_ALREADY_EXISTS` | Email already registered |
| `PASSWORD_MISMATCH` | Current password is incorrect |
| `SAME_PASSWORD` | New password matches current |

### System

| Code | Description |
|------|-------------|
| `INTERNAL_ERROR` | Unexpected server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |
| `RATE_LIMITED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |

---

## Architecture

### Directory Layout

```
apps/api/
├── src/
│   ├── config/           # Environment configuration
│   ├── middleware/        # Express middleware (validation, error handler, logging)
│   ├── repositories/     # Data access layer (Prisma queries)
│   ├── routes/           # HTTP route definitions
│   ├── services/         # Business logic layer
│   ├── utils/            # Shared utilities (JWT, errors, response helpers, pagination)
│   ├── app.ts            # Express application factory
│   └── index.ts          # Server entry point
```

### Request Flow

```
Client Request
    │
    ▼
Security Headers Middleware
    │
    ▼
CORS Middleware
    │
    ▼
Body Parser (JSON + URL-encoded)
    │
    ▼
Request Logger Middleware
    │
    ▼
Route Handler
    │
    ├── Auth Middleware (optional per route)
    │   │   ├── authenticate()  — Decodes JWT, attaches req.user
    │   │   └── requireRole(...) — Restricts to specific roles
    │   │
    │   ├── Validation Middleware (Zod)
    │   │       │
    │   │       ▼
    │   │   Service Layer (business logic)
    │   │       │
    │   │       ▼
    │   │   Repository Layer (Prisma queries)
    │   │       │
    │   │       ▼
    │   │   Database (PostgreSQL)
    │
    ▼
404 Handler (if no route matched)
    │
    ▼
Error Handler (catches all thrown errors)
    │
    ▼
JSON Response
```

### Singleton Pattern

Services and repositories are instantiated once as singletons and exported from barrel files (`index.ts`). This ensures a single Prisma client instance and consistent service state across the application lifecycle.

### Shared Packages

The API consumes shared packages from the monorepo:

| Package | Purpose |
|---------|---------|
| `@vestara/types` | DTOs, enums, shared interfaces |
| `@vestara/validation` | Zod schemas and validation utilities |
| `@vestara/constants` | HTTP status codes, error codes, route paths |
| `@vestara/utils` | Shared utility functions |
| `@vestara/config` | Shared configuration |
