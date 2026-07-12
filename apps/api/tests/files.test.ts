import request from 'supertest';
import { Server } from 'http';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { StorageProvider } from '../generated/prisma/client';

import { UserRole } from '@vestara/types';
import { createApp } from '../src/app.js';

const adapter = new PrismaPg({ connectionString: `${process.env.DATABASE_URL}` });
const prisma = new PrismaClient({ adapter });

describe('Files API', () => {
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
        email: `fileadmin-${Date.now()}@example.com`,
        password: 'Password123',
        firstName: 'File',
        lastName: 'Admin',
        role: UserRole.ADMIN,
      });

    adminToken = response.body.data.tokens.accessToken;
    userId = response.body.data.user.id;

    // Get the organizationId from the registered user
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    organizationId = dbUser!.organizationId;
  });

  describe('GET /files/stats', () => {
    it('should return file statistics', async () => {
      const response = await request(server)
        .get('/api/v1/files/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('totalFiles');
      expect(response.body.data.stats).toHaveProperty('totalSize');
      expect(response.body.data.stats).toHaveProperty('byProvider');
      expect(response.body.data.stats).toHaveProperty('byMimeType');
    });

    it('should return zero stats for empty organization', async () => {
      const response = await request(server)
        .get('/api/v1/files/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.stats.totalFiles).toBe(0);
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/files/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /files', () => {
    beforeEach(async () => {
      // Seed some file records directly in the database
      await prisma.file.createMany({
        data: [
          {
            name: 'document.pdf',
            originalName: 'document.pdf',
            mimeType: 'application/pdf',
            size: BigInt(1024),
            path: 'files/document.pdf',
            provider: StorageProvider.LOCAL,
            uploadedBy: userId,
            organizationId,
          },
          {
            name: 'image.png',
            originalName: 'image.png',
            mimeType: 'image/png',
            size: BigInt(2048),
            path: 'files/image.png',
            provider: StorageProvider.LOCAL,
            uploadedBy: userId,
            organizationId,
          },
        ],
      });
    });

    it('should list files with default pagination', async () => {
      const response = await request(server)
        .get('/api/v1/files')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter files by mimeType', async () => {
      const response = await request(server)
        .get('/api/v1/files?mimeType=image')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].mimeType).toBe('image/png');
    });

    it('should search files by name', async () => {
      const response = await request(server)
        .get('/api/v1/files?search=document')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].name).toBe('document.pdf');
    });

    it('should respect pagination', async () => {
      const response = await request(server)
        .get('/api/v1/files?page=1&perPage=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(2);
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/files')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /files/folder', () => {
    it('should return root folder contents', async () => {
      const response = await request(server)
        .get('/api/v1/files/folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.contents).toHaveProperty('files');
      expect(response.body.data.contents).toHaveProperty('folders');
      expect(Array.isArray(response.body.data.contents.files)).toBe(true);
      expect(Array.isArray(response.body.data.contents.folders)).toBe(true);
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .get('/api/v1/files/folder')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /files/folder', () => {
    it('should create a folder', async () => {
      const response = await request(server)
        .post('/api/v1/files/folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'My Folder' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.folder.name).toBe('My Folder');
      expect(response.body.data.folder).toHaveProperty('id');

      // Verify in database
      const dbFolder = await prisma.file.findUnique({
        where: { id: response.body.data.folder.id },
      });
      expect(dbFolder).not.toBeNull();
      expect(dbFolder!.mimeType).toBe('folder');
    });

    it('should create nested folder', async () => {
      // Create parent folder
      const parentResponse = await request(server)
        .post('/api/v1/files/folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Parent-${Date.now()}` });

      const parentId = parentResponse.body.data.folder.id;

      // Create child folder
      const response = await request(server)
        .post('/api/v1/files/folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Child-${Date.now()}`, parentFolderId: parentId })
        .expect(201);

      expect(response.body.data.folder.folderId).toBe(parentId);
    });

    it('should reject duplicate folder name in same parent', async () => {
      const uniqueName = `Dup-${Date.now()}`;

      // Create first folder
      await request(server)
        .post('/api/v1/files/folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: uniqueName });

      // Try to create another with same name
      const response = await request(server)
        .post('/api/v1/files/folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: uniqueName })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FOLDER_EXISTS');
    });

    it('should return 404 for non-existent parent folder', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(server)
        .post('/api/v1/files/folder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Orphan', parentFolderId: fakeId })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PARENT_FOLDER_NOT_FOUND');
    });

    it('should reject without authentication', async () => {
      const response = await request(server)
        .post('/api/v1/files/folder')
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /files/:id', () => {
    let fileId: string;

    beforeEach(async () => {
      const file = await prisma.file.create({
        data: {
          name: 'test-file.txt',
          originalName: 'test-file.txt',
          mimeType: 'text/plain',
          size: BigInt(512),
          path: 'files/test-file.txt',
          provider: StorageProvider.LOCAL,
          uploadedBy: userId,
          organizationId,
        },
      });
      fileId = file.id;
    });

    it('should get file by ID', async () => {
      const response = await request(server)
        .get(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.file.id).toBe(fileId);
      expect(response.body.data.file.name).toBe('test-file.txt');
      expect(response.body.data.file.mimeType).toBe('text/plain');
    });

    it('should return 404 for non-existent file', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(server)
        .get(`/api/v1/files/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /files/:id/download', () => {
    let fileId: string;

    beforeEach(async () => {
      const file = await prisma.file.create({
        data: {
          name: 'download-me.pdf',
          originalName: 'download-me.pdf',
          mimeType: 'application/pdf',
          size: BigInt(4096),
          path: 'files/download-me.pdf',
          provider: StorageProvider.LOCAL,
          uploadedBy: userId,
          organizationId,
        },
      });
      fileId = file.id;
    });

    it('should return download URL', async () => {
      const response = await request(server)
        .get(`/api/v1/files/${fileId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBeDefined();
    });
  });

  describe('PUT /files/:id', () => {
    let fileId: string;

    beforeEach(async () => {
      const file = await prisma.file.create({
        data: {
          name: 'rename-me.txt',
          originalName: 'rename-me.txt',
          mimeType: 'text/plain',
          size: BigInt(256),
          path: 'files/rename-me.txt',
          provider: StorageProvider.LOCAL,
          uploadedBy: userId,
          organizationId,
        },
      });
      fileId = file.id;
    });

    it('should rename a file', async () => {
      const response = await request(server)
        .put(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'renamed.txt' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.file.name).toBe('renamed.txt');

      // Verify in database
      const dbFile = await prisma.file.findUnique({ where: { id: fileId } });
      expect(dbFile!.name).toBe('renamed.txt');
    });
  });

  describe('DELETE /files/:id', () => {
    let fileId: string;

    beforeEach(async () => {
      const file = await prisma.file.create({
        data: {
          name: 'delete-me.txt',
          originalName: 'delete-me.txt',
          mimeType: 'text/plain',
          size: BigInt(128),
          path: 'files/delete-me.txt',
          provider: StorageProvider.LOCAL,
          uploadedBy: userId,
          organizationId,
        },
      });
      fileId = file.id;
    });

    it('should delete a file', async () => {
      await request(server)
        .delete(`/api/v1/files/${fileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify deleted from database
      const dbFile = await prisma.file.findUnique({ where: { id: fileId } });
      expect(dbFile).toBeNull();
    });

    it('should return 404 for non-existent file', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(server)
        .delete(`/api/v1/files/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /files/bulk-delete', () => {
    let fileIds: string[];

    beforeEach(async () => {
      await prisma.file.createMany({
        data: [
          {
            name: 'bulk1.txt',
            originalName: 'bulk1.txt',
            mimeType: 'text/plain',
            size: BigInt(100),
            path: 'files/bulk1.txt',
            provider: StorageProvider.LOCAL,
            uploadedBy: userId,
            organizationId,
          },
          {
            name: 'bulk2.txt',
            originalName: 'bulk2.txt',
            mimeType: 'text/plain',
            size: BigInt(200),
            path: 'files/bulk2.txt',
            provider: StorageProvider.LOCAL,
            uploadedBy: userId,
            organizationId,
          },
        ],
      });

      const createdFiles = await prisma.file.findMany({
        where: { organizationId },
        select: { id: true },
      });
      fileIds = createdFiles.map((f) => f.id);
    });

    it('should bulk delete files', async () => {
      const response = await request(server)
        .post('/api/v1/files/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(2);

      // Verify deleted
      const remaining = await prisma.file.findMany({ where: { organizationId } });
      expect(remaining).toHaveLength(0);
    });
  });

  describe('POST /files/move', () => {
    let fileId: string;
    let folderId: string;

    beforeEach(async () => {
      // Create a folder
      const folder = await prisma.file.create({
        data: {
          name: `Target-${Date.now()}`,
          originalName: `Target-${Date.now()}`,
          mimeType: 'folder',
          size: BigInt(0),
          path: '',
          provider: StorageProvider.LOCAL,
          uploadedBy: userId,
          organizationId,
        },
      });
      folderId = folder.id;

      // Create a file to move
      const file = await prisma.file.create({
        data: {
          name: 'movable.txt',
          originalName: 'movable.txt',
          mimeType: 'text/plain',
          size: BigInt(100),
          path: 'files/movable.txt',
          provider: StorageProvider.LOCAL,
          uploadedBy: userId,
          organizationId,
        },
      });
      fileId = file.id;
    });

    it('should move files to folder', async () => {
      const response = await request(server)
        .post('/api/v1/files/move')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileIds: [fileId], folderId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.moved).toBe(1);

      // Verify file moved
      const movedFile = await prisma.file.findUnique({ where: { id: fileId } });
      expect(movedFile!.folderId).toBe(folderId);
    });

    it('should return 404 for non-existent target folder', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(server)
        .post('/api/v1/files/move')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fileIds: [fileId], folderId: fakeId })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TARGET_FOLDER_NOT_FOUND');
    });
  });

  describe('PUT /files/storage/settings', () => {
    it('should update storage settings as SUPER_ADMIN', async () => {
      // Register a SUPER_ADMIN user
      const superAdminResponse = await request(server)
        .post('/api/v1/auth/register')
        .send({
          email: `storageadmin-${Date.now()}@example.com`,
          password: 'Password123',
          firstName: 'Storage',
          lastName: 'Admin',
          role: UserRole.SUPER_ADMIN,
        });

      const superAdminToken = superAdminResponse.body.data.tokens.accessToken;

      const response = await request(server)
        .put('/api/v1/files/storage/settings')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ provider: 'LOCAL', config: {} })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings.provider).toBe('LOCAL');
    });

    it('should reject storage settings update as ADMIN', async () => {
      const response = await request(server)
        .put('/api/v1/files/storage/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ provider: 'LOCAL', config: {} })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /files/storage/settings', () => {
    it('should get storage settings as ADMIN', async () => {
      const response = await request(server)
        .get('/api/v1/files/storage/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toHaveProperty('provider');
    });
  });
});
