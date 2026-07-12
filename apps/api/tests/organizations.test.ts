import request from 'supertest';
import { Server } from 'http';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

import { UserRole } from '@vestara/types';
import { createApp } from '../src/app.js';

const adapter = new PrismaPg({ connectionString: `${process.env.DATABASE_URL}` });
const prisma = new PrismaClient({ adapter });

describe('Organizations API', () => {
  let server: Server;
  let superAdminToken: string;

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

    // Register a SUPER_ADMIN user — this also creates the default organization
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: `orgadmin-${Date.now()}@example.com`,
        password: 'Password123',
        firstName: 'Org',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
      });

    superAdminToken = response.body.data.tokens.accessToken;
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const orgData = {
        name: 'Acme Corp',
        slug: `acme-${Date.now()}`,
      };

      const response = await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(orgData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organization.name).toBe(orgData.name);
      expect(response.body.data.organization.slug).toBe(orgData.slug);

      // Verify in database
      const dbOrg = await prisma.organization.findUnique({
        where: { slug: orgData.slug },
      });
      expect(dbOrg).not.toBeNull();
      expect(dbOrg!.name).toBe(orgData.name);
    });

    it('should create organization with optional logoUrl', async () => {
      const orgData = {
        name: 'Logo Corp',
        slug: `logo-${Date.now()}`,
        logoUrl: 'https://example.com/logo.png',
      };

      const response = await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(orgData)
        .expect(201);

      expect(response.body.data.organization.logoUrl).toBe(orgData.logoUrl);
    });

    it('should reject duplicate slug', async () => {
      const slug = `dup-${Date.now()}`;
      const orgData = { name: 'Acme Corp', slug };

      // Create first organization
      await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(orgData);

      // Try to create with same slug
      const response = await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(orgData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ORGANIZATION_SLUG_EXISTS');
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .post('/api/v1/organizations')
        .send({ name: 'Test', slug: 'test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject with non-SUPER_ADMIN role', async () => {
      // Register an ADMIN user
      const adminResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `admin-${Date.now()}@example.com`,
          password: 'Password123',
          firstName: 'Regular',
          lastName: 'Admin',
          role: UserRole.ADMIN,
        });

      const adminToken = adminResponse.body.data.tokens.accessToken;

      const response = await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test', slug: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid input', async () => {
      const response = await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: '', slug: '' })
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /organizations', () => {
    it('should list all organizations with member counts', async () => {
      // Create some organizations
      const slug1 = `org1-${Date.now()}`;
      const slug2 = `org2-${Date.now()}`;
      await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Org One', slug: slug1 });
      await request(server)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Org Two', slug: slug2 });

      const response = await request(server)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organizations.length).toBeGreaterThanOrEqual(2);

      // Each org should have a userCount
      for (const org of response.body.data.organizations) {
        expect(org).toHaveProperty('userCount');
        expect(typeof org.userCount).toBe('number');
      }
    });

    it('should include organization details', async () => {
      const response = await request(server)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const org = response.body.data.organizations[0];
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('slug');
      expect(org).toHaveProperty('createdAt');
      expect(org).toHaveProperty('updatedAt');
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/organizations')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /organizations/:id', () => {
    it('should get organization by ID', async () => {
      // First get the default org created by registration
      const listResponse = await request(server)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const org = listResponse.body.data.organizations[0];

      const response = await request(server)
        .get(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organization.id).toBe(org.id);
      expect(response.body.data.organization.name).toBe(org.name);
      expect(response.body.data.organization.userCount).toBeGreaterThanOrEqual(1);
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(server)
        .get(`/api/v1/organizations/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /organizations/:id', () => {
    it('should update organization name', async () => {
      // Get the default org
      const listResponse = await request(server)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const org = listResponse.body.data.organizations[0];

      const response = await request(server)
        .put(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.organization.name).toBe('Updated Name');

      // Verify in database
      const dbOrg = await prisma.organization.findUnique({ where: { id: org.id } });
      expect(dbOrg!.name).toBe('Updated Name');
    });

    it('should update organization logoUrl', async () => {
      const listResponse = await request(server)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const org = listResponse.body.data.organizations[0];

      const response = await request(server)
        .put(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ logoUrl: 'https://example.com/new-logo.png' })
        .expect(200);

      expect(response.body.data.organization.logoUrl).toBe('https://example.com/new-logo.png');
    });

    it('should clear logoUrl with empty string', async () => {
      const listResponse = await request(server)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const org = listResponse.body.data.organizations[0];

      // First set a logo
      await request(server)
        .put(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ logoUrl: 'https://example.com/logo.png' });

      // Then clear it
      const response = await request(server)
        .put(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ logoUrl: '' })
        .expect(200);

      expect(response.body.data.organization.logoUrl).toBeNull();
    });

    it('should return 404 for non-existent organization', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(server)
        .put(`/api/v1/organizations/${fakeId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
