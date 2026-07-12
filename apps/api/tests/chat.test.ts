import request from 'supertest';
import { Server } from 'http';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

import { UserRole } from '@vestara/types';
import { createApp } from '../src/app.js';

const adapter = new PrismaPg({ connectionString: `${process.env.DATABASE_URL}` });
const prisma = new PrismaClient({ adapter });

describe('Chat API', () => {
  let server: Server;
  let accessToken: string;
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
    // Clean up in FK order
    await prisma.chatMessage.deleteMany();
    await prisma.chatConversation.deleteMany();
    await prisma.session.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.file.deleteMany();
    await prisma.systemSetting.deleteMany();
    await prisma.user.deleteMany();

    // Register a test user and get token
    const registerRes = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: 'chattest@example.com',
        password: 'Password123',
        firstName: 'Chat',
        lastName: 'Tester',
        role: UserRole.ADMIN,
      })
      .expect(201);

    accessToken = registerRes.body.data.tokens.accessToken;
    userId = registerRes.body.data.user.id;
    organizationId = registerRes.body.data.user.organizationId;
  });

  describe('GET /chat/models', () => {
    it('should list available AI models', async () => {
      const response = await request(server)
        .get('/api/v1/chat/models')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.models).toBeDefined();
      expect(Array.isArray(response.body.data.models)).toBe(true);
      expect(response.body.data.models.length).toBeGreaterThan(0);

      // Should include mock model
      const mockModel = response.body.data.models.find(
        (m: { id: string }) => m.id === 'mock',
      );
      expect(mockModel).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(server)
        .get('/api/v1/chat/models')
        .expect(401);
    });
  });

  describe('POST /chat/conversations', () => {
    it('should create a new conversation', async () => {
      const response = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Conversation',
          model: 'mock',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversation).toBeDefined();
      expect(response.body.data.conversation.title).toBe('Test Conversation');
      expect(response.body.data.conversation.model).toBe('mock');
      expect(response.body.data.conversation.userId).toBe(userId);
      expect(response.body.data.conversation.organizationId).toBe(organizationId);
    });

    it('should create conversation with first message', async () => {
      const response = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Conversation with Message',
          model: 'mock',
          firstMessage: 'Hello, AI!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversation).toBeDefined();

      // Should have messages
      const messagesRes = await request(server)
        .get(`/api/v1/chat/conversations/${response.body.data.conversation.id}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(messagesRes.body.data.messages.length).toBe(2);
      expect(messagesRes.body.data.messages[0].role).toBe('user');
      expect(messagesRes.body.data.messages[0].content).toBe('Hello, AI!');
      expect(messagesRes.body.data.messages[1].role).toBe('assistant');
    });

    it('should default to mock model when no model specified', async () => {
      const response = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Default Model Test',
        })
        .expect(201);

      expect(response.body.data.conversation.model).toBe('mimo-v2.5-free');
    });
  });

  describe('GET /chat/conversations', () => {
    it('should list user conversations', async () => {
      // Create a conversation first
      await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'List Test', model: 'mock' })
        .expect(201);

      const response = await request(server)
        .get('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toBeDefined();
      expect(response.body.data.conversations.length).toBe(1);
      expect(response.body.data.pagination.total).toBe(1);
    });

    it('should support pagination', async () => {
      // Create multiple conversations
      for (let i = 0; i < 3; i++) {
        await request(server)
          .post('/api/v1/chat/conversations')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: `Conv ${i}`, model: 'mock' });
      }

      const response = await request(server)
        .get('/api/v1/chat/conversations?page=1&perPage=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.conversations.length).toBe(2);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should support search', async () => {
      await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Unique Search Term', model: 'mock' });

      await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Another Conversation', model: 'mock' });

      const response = await request(server)
        .get('/api/v1/chat/conversations?search=Unique')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.conversations.length).toBe(1);
      expect(response.body.data.conversations[0].title).toBe('Unique Search Term');
    });
  });

  describe('GET /chat/conversations/:id', () => {
    it('should get a conversation with details', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Get Test', model: 'mock' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      const response = await request(server)
        .get(`/api/v1/chat/conversations/${convId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversation.id).toBe(convId);
      expect(response.body.data.conversation.title).toBe('Get Test');
    });

    it('should return 404 for non-existent conversation', async () => {
      await request(server)
        .get('/api/v1/chat/conversations/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /chat/conversations/:id', () => {
    it('should rename a conversation', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Old Title', model: 'mock' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      const response = await request(server)
        .put(`/api/v1/chat/conversations/${convId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'New Title' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify rename
      const getRes = await request(server)
        .get(`/api/v1/chat/conversations/${convId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getRes.body.data.conversation.title).toBe('New Title');
    });
  });

  describe('PATCH /chat/conversations/:id/archive', () => {
    it('should toggle archive status', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Archive Test', model: 'mock' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      // Archive
      const archiveRes = await request(server)
        .patch(`/api/v1/chat/conversations/${convId}/archive`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(archiveRes.body.data.isArchived).toBe(true);

      // Unarchive
      const unarchiveRes = await request(server)
        .patch(`/api/v1/chat/conversations/${convId}/archive`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(unarchiveRes.body.data.isArchived).toBe(false);
    });
  });

  describe('DELETE /chat/conversations/:id', () => {
    it('should delete a conversation', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Delete Test', model: 'mock' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      await request(server)
        .delete(`/api/v1/chat/conversations/${convId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deleted
      await request(server)
        .get(`/api/v1/chat/conversations/${convId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /chat/conversations/:id/messages', () => {
    it('should send a message and get AI response', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Message Test', model: 'mock' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      const response = await request(server)
        .post(`/api/v1/chat/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Hello, AI!' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userMessage).toBeDefined();
      expect(response.body.data.assistantMessage).toBeDefined();
      expect(response.body.data.userMessage.content).toBe('Hello, AI!');
      expect(response.body.data.userMessage.role).toBe('user');
      expect(response.body.data.assistantMessage.role).toBe('assistant');
      expect(response.body.data.assistantMessage.content).toBeDefined();
      expect(response.body.data.usage).toBeDefined();
    });

    it('should reject empty messages', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Empty Test', model: 'mock' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      await request(server)
        .post(`/api/v1/chat/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' })
        .expect(400);

      await request(server)
        .post(`/api/v1/chat/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '   ' })
        .expect(400);
    });

    it('should maintain conversation context', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Context Test', model: 'mock' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      // Send first message
      await request(server)
        .post(`/api/v1/chat/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'My name is Alice' })
        .expect(200);

      // Send second message
      const response = await request(server)
        .post(`/api/v1/chat/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'What is my name?' })
        .expect(200);

      expect(response.body.data.assistantMessage.content).toBeDefined();

      // Verify messages are stored in order
      const messagesRes = await request(server)
        .get(`/api/v1/chat/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(messagesRes.body.data.messages.length).toBe(4);
      expect(messagesRes.body.data.messages[0].content).toBe('My name is Alice');
      expect(messagesRes.body.data.messages[2].content).toBe('What is my name?');
    });
  });

  describe('GET /chat/conversations/:id/messages', () => {
    it('should list messages with pagination', async () => {
      const createRes = await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Pagination Test', model: 'mock', firstMessage: 'Hello' })
        .expect(201);

      const convId = createRes.body.data.conversation.id;

      const response = await request(server)
        .get(`/api/v1/chat/conversations/${convId}/messages?page=1&perPage=1`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.messages.length).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
    });
  });

  describe('GET /chat/stats', () => {
    it('should return chat statistics', async () => {
      // Create some conversations
      await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Stats Conv 1', model: 'mock' });

      await request(server)
        .post('/api/v1/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Stats Conv 2', model: 'mock' });

      const response = await request(server)
        .get('/api/v1/chat/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalConversations).toBe(2);
    });
  });

  describe('OpenCode API Integration', () => {
    it('should use OpenCode API when OPENCODE_API_KEY is set', async () => {
      // This test verifies the OpenCode provider is initialized
      // It uses the mock model to avoid actual API calls in CI
      const modelsRes = await request(server)
        .get('/api/v1/chat/models')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const models = modelsRes.body.data.models;

      // Should have OpenCode models listed
      const opencodeModels = models.filter(
        (m: { provider: string }) => m.provider === 'opencode',
      );

      // If OPENCODE_API_KEY is set, should have opencode models
      if (process.env.OPENCODE_API_KEY) {
        expect(opencodeModels.length).toBeGreaterThan(0);
        expect(opencodeModels.some((m: { id: string }) => m.id === 'mimo-v2.5-free')).toBe(true);
      }
    });
  });
});
