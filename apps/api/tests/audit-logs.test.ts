import request from 'supertest';
import { Server } from 'http';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

import { UserRole } from '@vestara/types';
import { createApp } from '../src/app.js';

const adapter = new PrismaPg({ connectionString: `${process.env.DATABASE_URL}` });
const prisma = new PrismaClient({ adapter });

describe('Audit Logs API', () => {
  let server: Server;
  let adminToken: string;
  let userId: string;
  let organizationId: string;

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);
  });

  afterAll(async () => {
    await server.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Delete in proper FK order — files first (uploadedBy has Restrict)
    await prisma.file.deleteMany({});
    await prisma.session.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.systemSetting.deleteMany();
    await prisma.user.deleteMany();

    // Register an ADMIN user — this also creates the default organization
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: `auditadmin-${Date.now()}@example.com`,
        password: 'Password123',
        firstName: 'Audit',
        lastName: 'Admin',
        role: UserRole.ADMIN,
      });

    adminToken = response.body.data.tokens.accessToken;
    userId = response.body.data.user.id;

    // Get the organizationId from the registered user
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    organizationId = dbUser!.organizationId;
  });

  describe('GET /audit-logs', () => {
    beforeEach(async () => {
      // Seed some audit log entries
      await prisma.auditLog.createMany({
        data: [
          {
            action: 'LOGIN',
            entity: 'user',
            entityId: userId,
            userId,
            organizationId,
            metadata: { email: 'auditadmin@example.com' },
          },
          {
            action: 'CREATE',
            entity: 'file',
            entityId: 'file-123',
            userId,
            organizationId,
            metadata: { fileName: 'test.pdf' },
          },
          {
            action: 'UPDATE',
            entity: 'setting',
            entityId: 'setting-123',
            userId,
            organizationId,
            metadata: { key: 'theme', oldValue: 'light', newValue: 'dark' },
          },
        ],
      });
    });

    it('should list audit logs with default pagination', async () => {
      const response = await request(server)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
      expect(response.body.data.meta.total).toBe(3);
    });

    it('should filter by action', async () => {
      const response = await request(server)
        .get('/api/v1/audit-logs?action=LOGIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].action).toBe('LOGIN');
    });

    it('should filter by entity', async () => {
      const response = await request(server)
        .get('/api/v1/audit-logs?entity=file')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].entity).toBe('file');
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const response = await request(server)
        .get(`/api/v1/audit-logs?startDate=${yesterday.toISOString()}&endDate=${tomorrow.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(3);
    });

    it('should respect pagination', async () => {
      const response = await request(server)
        .get('/api/v1/audit-logs?page=1&perPage=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.meta.total).toBe(3);
      expect(response.body.data.meta.totalPages).toBe(2);
    });

    it('should include user information', async () => {
      const response = await request(server)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const log = response.body.data.data[0];
      expect(log).toHaveProperty('user');
      expect(log.user).toHaveProperty('id');
      expect(log.user).toHaveProperty('firstName');
      expect(log.user).toHaveProperty('lastName');
      expect(log.user).toHaveProperty('email');
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/audit-logs')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject with non-admin role', async () => {
      // Register a SUPPORT user
      const supportResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `support-${Date.now()}@example.com`,
          password: 'Password123',
          firstName: 'Support',
          lastName: 'User',
          role: UserRole.SUPPORT,
        });

      const supportToken = supportResponse.body.data.tokens.accessToken;

      const response = await request(server)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${supportToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /audit-logs/:id', () => {
    let logId: string;

    beforeEach(async () => {
      const log = await prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          entity: 'user',
          entityId: userId,
          userId,
          organizationId,
          metadata: { email: 'auditadmin@example.com' },
        },
      });
      logId = log.id;
    });

    it('should get audit log by ID', async () => {
      const response = await request(server)
        .get(`/api/v1/audit-logs/${logId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.log.id).toBe(logId);
      expect(response.body.data.log.action).toBe('LOGIN');
      expect(response.body.data.log.entity).toBe('user');
      expect(response.body.data.log.entityId).toBe(userId);
    });

    it('should include user information', async () => {
      const response = await request(server)
        .get(`/api/v1/audit-logs/${logId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.log.user).toHaveProperty('id');
      expect(response.body.data.log.user.id).toBe(userId);
    });

    it('should return 404 for non-existent log', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(server)
        .get(`/api/v1/audit-logs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .get(`/api/v1/audit-logs/${logId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject with non-admin role', async () => {
      const supportResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `support2-${Date.now()}@example.com`,
          password: 'Password123',
          firstName: 'Support',
          lastName: 'User',
          role: UserRole.SUPPORT,
        });

      const supportToken = supportResponse.body.data.tokens.accessToken;

      const response = await request(server)
        .get(`/api/v1/audit-logs/${logId}`)
        .set('Authorization', `Bearer ${supportToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Audit log scoping', () => {
    it('should only return logs for the user\'s organization', async () => {
      // Create another user in a different organization via direct DB insert
      const otherOrg = await prisma.organization.create({
        data: { name: 'Other Org', slug: `other-${Date.now()}` },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: `other-${Date.now()}@example.com`,
          firstName: 'Other',
          lastName: 'User',
          role: UserRole.ADMIN,
          organizationId: otherOrg.id,
        },
      });

      // Create audit logs in both organizations
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          entity: 'user',
          entityId: userId,
          userId,
          organizationId,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'LOGIN',
          entity: 'user',
          entityId: otherUser.id,
          userId: otherUser.id,
          organizationId: otherOrg.id,
        },
      });

      // Request as the first user — should only see their org's logs
      const response = await request(server)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].organizationId).toBe(organizationId);
    });
  });
});
