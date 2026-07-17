import request from 'supertest';
import { Server } from 'http';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { compare } from 'bcryptjs';

import { UserRole } from '@vestara/types';
import { createApp } from '../src/app.js';

const adapter = new PrismaPg({ connectionString: `${process.env.DATABASE_URL}` });
const prisma = new PrismaClient({ adapter });

describe('Authentication API', () => {
  let server: Server;

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Delete in FK order: children before parents
    await prisma.session.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.file.deleteMany();
    await prisma.systemSetting.deleteMany();
    await prisma.report.deleteMany();
    await prisma.reportTemplate.deleteMany();
    await prisma.dataSource.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ADMIN,
      };

      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data.user.lastName).toBe(userData.lastName);
      expect(response.body.data.user.role).toBe(userData.role);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Verify password is not returned
      expect(response.body.data.user.passwordHash).toBeUndefined();

      // Verify user exists in database with a matching password hash
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(dbUser).not.toBeNull();
      expect(await compare(userData.password, dbUser!.passwordHash!)).toBe(true);
    });

    it('should not allow duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ADMIN,
      };

      // Register first user
      await request(server).post('/api/v1/auth/register').send(userData);

      // Try to register same email
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
    });
  });

  describe('POST /auth/login', () => {
    let user: any;

    beforeEach(async () => {
      const userData = {
        email: 'loginuser@example.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.ADMIN,
      };

      const response = await request(server).post('/api/v1/auth/register').send(userData);
      user = response.body.data.user;
    });

    it('should login with valid credentials', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();

      // Verify last login was updated
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { lastLoginAt: true },
      });
      expect(dbUser!.lastLoginAt).not.toBeNull();
    });

    it('should reject invalid password', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Password999!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject inactive user', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /auth/refresh', () => {
    let user: any;
    let refreshToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'refreshuser@example.com',
        password: 'Password123!',
        firstName: 'Bob',
        lastName: 'Johnson',
        role: UserRole.ADMIN,
      };

      const response = await request(server).post('/api/v1/auth/register').send(userData);
      user = response.body.data.user;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken);

      // The access token payload (id claim) must reference the same user
      // while the signed token itself differs from any previously issued token.
      const decoded = JSON.parse(
        Buffer.from(response.body.data.tokens.accessToken.split('.')[1], 'base64').toString(),
      );
      expect(decoded.id).toBe(user.id);
    });

    it('should reject with invalid refresh token', async () => {
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('REFRESH_TOKEN_INVALID');
    });
  });

  describe('POST /auth/logout', () => {
    let user: any;
    let refreshToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'logoutuser@example.com',
        password: 'Password123!',
        firstName: 'Alice',
        lastName: 'Brown',
        role: UserRole.ADMIN,
      };

      const response = await request(server).post('/api/v1/auth/register').send(userData);
      user = response.body.data.user;
      refreshToken = response.body.data.tokens.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(server)
        .post('/api/v1/auth/logout')
        .send({
          userId: user.id,
          refreshToken,
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify refresh token is revoked
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(tokenRecord).not.toBeNull();
      expect(tokenRecord!.revokedAt).not.toBeNull();
    });
  });

  describe('GET /auth/me', () => {
    let user: any;
    let accessToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'meuser@example.com',
        password: 'Password123!',
        firstName: 'Charlie',
        lastName: 'Davis',
        role: UserRole.ADMIN,
      };

      const response = await request(server).post('/api/v1/auth/register').send(userData);
      user = response.body.data.user;
      accessToken = response.body.data.tokens.accessToken;
    });

    it('should get current user with valid token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('should reject without token', async () => {
      const response = await request(server).get('/api/v1/auth/me').expect(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_INVALID');
    });

    it('should reject with invalid token', async () => {
      const response = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_INVALID');
    });
  });
});
