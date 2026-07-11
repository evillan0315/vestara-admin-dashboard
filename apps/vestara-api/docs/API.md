# Vestara API Documentation

## Base URL

Production:

```text
https://vestara-api.vercel.app/api
```

Interactive Swagger documentation:

```text
https://vestara-api.vercel.app/docs
```

---

# Authentication

Vestara uses JWT Bearer authentication.

Protected endpoints require:

```http
Authorization: Bearer <token>
```

---

# Health Check

## GET /health

Checks API availability.

### Request

```http
GET https://vestara-api.vercel.app/health
```

### Response

```json
{
  "status": "ok",
  "timestamp": "2026-06-20T12:00:00.000Z"
}
```

---

# Auth Module

## Register

Create a new user account.

### POST /auth/register

### Request

```http
POST https://vestara-api.vercel.app/api/auth/register
Content-Type: application/json
```

Body:

```json
{
  "email": "john@example.com",
  "phone": "+639171234567",
  "password": "StrongPassword123"
}
```

### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cmczxxxx",
    "email": "john@example.com",
    "phone": "+639171234567",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-06-20T10:00:00.000Z",
    "updatedAt": "2026-06-20T10:00:00.000Z"
  }
}
```

---

## Login

Authenticate using email or phone.

### POST /auth/login

### Request

```http
POST https://vestara-api.vercel.app/api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "identifier": "john@example.com",
  "password": "StrongPassword123"
}
```

or

```json
{
  "identifier": "+639171234567",
  "password": "StrongPassword123"
}
```

### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cmczxxxx",
    "email": "john@example.com",
    "phone": "+639171234567",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-06-20T10:00:00.000Z",
    "updatedAt": "2026-06-20T10:00:00.000Z"
  }
}
```

---

## Current User

Returns the authenticated user.

### GET /auth/me

### Request

```http
GET https://vestara-api.vercel.app/api/auth/me
Authorization: Bearer <token>
```

### Response

```json
{
  "id": "cmczxxxx",
  "email": "john@example.com",
  "phone": "+639171234567",
  "role": "USER",
  "status": "ACTIVE",
  "createdAt": "2026-06-20T10:00:00.000Z",
  "updatedAt": "2026-06-20T10:00:00.000Z"
}
```

---

# Subscribers Module

## Get Subscribers

### GET /subscribers

```http
GET https://vestara-api.vercel.app/api/subscribers
```

### Response

```json
[
  {
    "id": "cmczxxxx",
    "email": "user@example.com",
    "phone": "+639171111111",
    "source": "website",
    "synced": true,
    "createdAt": "2026-06-20T10:00:00.000Z"
  }
]
```

---

# Upload Module

## Upload File

### POST /upload

```http
POST https://vestara-api.vercel.app/api/upload
Content-Type: multipart/form-data
```

Form fields:

| Name | Type |
|--------|------|
| file | binary |

### Response

```json
{
  "url": "https://cdn.vestara.com/uploads/file.png"
}
```

---

# Cron Endpoints

## Sync Subscribers

### GET /cron/sync-subscribers

```http
GET https://vestara-api.vercel.app/cron/sync-subscribers
Authorization: Bearer <CRON_SECRET>
```

### Response

```json
{
  "success": true,
  "count": 125,
  "timestamp": "2026-06-20T10:00:00.000Z"
}
```

---

# Error Responses

## Unauthorized

```json
{
  "error": "Unauthorized"
}
```

## Invalid Credentials

```json
{
  "error": "Invalid credentials"
}
```

## Validation Error

```json
{
  "error": "Validation failed"
}
```

## Resource Not Found

```json
{
  "error": "Resource not found"
}
```

---

# Enumerations

## Role

```text
USER
ADMIN
```

## User Status

```text
ACTIVE
SUSPENDED
PENDING
```

## Transaction Status

```text
PENDING
COMPLETED
FAILED
```

## Investment Status

```text
PENDING
ACTIVE
COMPLETED
CANCELLED
```

## Notification Type

```text
SYSTEM
TRANSACTION
INVESTMENT
SECURITY
```

---

# Swagger UI

Interactive documentation:

```text
https://vestara-api.vercel.app/docs
```

---

# Stack

- Fastify
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Argon2 Password Hashing
- Zod Validation
- Swagger / OpenAPI
- Vercel