import { BaseRepository } from './base.repository.js';
import type { Prisma } from '../../generated/prisma/client.js';

export interface CreateConversationData {
  title: string;
  userId: string;
  organizationId: string;
  model?: string;
  systemPrompt?: string;
}

export interface CreateMessageData {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  userId?: string;
  model?: string;
  tokenCount?: number;
  metadata?: Prisma.InputJsonValue;
}

export interface ConversationListParams {
  organizationId: string;
  userId: string;
  page?: number;
  perPage?: number;
  search?: string;
  isArchived?: boolean;
}

export interface MessageListParams {
  conversationId: string;
  page?: number;
  perPage?: number;
}

/**
 * Repository for chat conversations and messages.
 * Provides org-scoped, user-scoped data access with pagination.
 */
export class ChatRepository extends BaseRepository {
  /**
   * Create a new conversation.
   */
  async createConversation(data: CreateConversationData) {
    return this.prisma.chatConversation.create({
      data: {
        title: data.title,
        userId: data.userId,
        organizationId: data.organizationId,
        model: data.model ?? 'gpt-4',
        systemPrompt: data.systemPrompt,
      },
    });
  }

  /**
   * Get a conversation by ID (org-scoped).
   */
  async findConversationById(id: string, organizationId: string) {
    return this.prisma.chatConversation.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * List conversations for a user within an organization.
   */
  async listConversations(params: ConversationListParams) {
    const { organizationId, userId, page = 1, perPage = 20, search, isArchived } = params;
    const skip = (page - 1) * perPage;

    const where: Prisma.ChatConversationWhereInput = {
      organizationId,
      userId,
      ...(isArchived !== undefined ? { isArchived } : { isArchived: false }),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.chatConversation.findMany({
        where,
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.chatConversation.count({ where }),
    ]);

    return { conversations, total };
  }

  /**
   * Update a conversation.
   */
  async updateConversation(
    id: string,
    organizationId: string,
    data: Prisma.ChatConversationUpdateInput,
  ) {
    return this.prisma.chatConversation.updateMany({
      where: { id, organizationId },
      data,
    });
  }

  /**
   * Delete a conversation and all its messages (cascade).
   */
  async deleteConversation(id: string, organizationId: string) {
    return this.prisma.chatConversation.deleteMany({
      where: { id, organizationId },
    });
  }

  /**
   * Create a new message in a conversation.
   */
  async createMessage(data: CreateMessageData) {
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        userId: data.userId,
        model: data.model,
        tokenCount: data.tokenCount,
        metadata: data.metadata,
      },
    });

    // Update conversation's updatedAt timestamp
    await this.prisma.chatConversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * List messages for a conversation with pagination.
   */
  async listMessages(params: MessageListParams) {
    const { conversationId, page = 1, perPage = 50 } = params;
    const skip = (page - 1) * perPage;

    const where: Prisma.ChatMessageWhereInput = { conversationId };

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: perPage,
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    return { messages, total };
  }

  /**
   * Get recent messages for context (used by AI service).
   */
  async getRecentMessages(conversationId: string, limit = 20) {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        role: true,
        content: true,
      },
    });
  }

  /**
   * Get conversation statistics for an organization.
   */
  async getStats(organizationId: string) {
    const [totalConversations, totalMessages, activeConversations] = await Promise.all([
      this.prisma.chatConversation.count({
        where: { organizationId },
      }),
      this.prisma.chatMessage.count({
        where: {
          conversation: { organizationId },
        },
      }),
      this.prisma.chatConversation.count({
        where: { organizationId, isArchived: false },
      }),
    ]);

    return { totalConversations, totalMessages, activeConversations };
  }
}
