import { chatRepository } from '../repositories/index.js';
import { aiService, buildContext } from './ai/index.js';
import { getAvailableModels } from './ai/types.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import type { AIMessage } from './ai/types.js';

const DEFAULT_SYSTEM_PROMPT = `You are Vestara AI, an intelligent assistant for the Vestara Admin Dashboard.
You help administrators manage their security/companion service platform.

Your capabilities include:
- Explaining dashboard metrics and analytics
- Guiding users through admin features
- Providing best practices for security and user management
- Answering questions about system settings and configuration

Be helpful, concise, and professional. Use markdown formatting when appropriate.
If you don't know something, say so honestly rather than making up information.`;

export class ChatService {
  /**
   * Create a new conversation with an optional first message.
   */
  async createConversation(
    userId: string,
    organizationId: string,
    data: {
      title: string;
      model?: string;
      systemPrompt?: string;
      firstMessage?: string;
    },
  ) {
    const conversation = await chatRepository.createConversation({
      title: data.title,
      userId,
      organizationId,
      model: data.model ?? 'nemotron-3-ultra-free',
      systemPrompt: data.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    });

    // If a first message is provided, send it and get AI response
    if (data.firstMessage) {
      await this.sendMessage(conversation.id, userId, organizationId, {
        content: data.firstMessage,
        model: data.model,
      });
    }

    return this.getConversation(conversation.id, userId, organizationId);
  }

  /**
   * Get a conversation by ID with latest message.
   */
  async getConversation(id: string, userId: string, organizationId: string) {
    const conversation = await chatRepository.findConversationById(id, organizationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    // Verify user owns this conversation
    if (conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      organizationId: conversation.organizationId,
      model: conversation.model,
      systemPrompt: conversation.systemPrompt,
      isArchived: conversation.isArchived,
      messageCount: conversation._count.messages,
      lastMessage: conversation.messages[0]
        ? {
            id: conversation.messages[0].id,
            conversationId: conversation.messages[0].conversationId,
            role: conversation.messages[0].role,
            content: conversation.messages[0].content,
            model: conversation.messages[0].model,
            tokenCount: conversation.messages[0].tokenCount,
            metadata: conversation.messages[0].metadata as Record<string, unknown> | null,
            createdAt: conversation.messages[0].createdAt.toISOString(),
          }
        : undefined,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }

  /**
   * List conversations for a user.
   */
  async listConversations(
    userId: string,
    organizationId: string,
    params?: {
      page?: number;
      perPage?: number;
      search?: string;
      isArchived?: boolean;
    },
  ) {
    const { conversations, total } = await chatRepository.listConversations({
      organizationId,
      userId,
      ...params,
    });

    return {
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        userId: c.userId,
        organizationId: c.organizationId,
        model: c.model,
        systemPrompt: c.systemPrompt,
        isArchived: c.isArchived,
        messageCount: c._count.messages,
        lastMessage: c.messages[0]
          ? {
              id: c.messages[0].id,
              conversationId: c.messages[0].conversationId,
              role: c.messages[0].role,
              content: c.messages[0].content,
              model: c.messages[0].model,
              tokenCount: c.messages[0].tokenCount,
              metadata: c.messages[0].metadata as Record<string, unknown> | null,
              createdAt: c.messages[0].createdAt.toISOString(),
            }
          : undefined,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * Send a message in a conversation and get AI response.
   */
  async sendMessage(
    conversationId: string,
    userId: string,
    organizationId: string,
    data: {
      content: string;
      model?: string;
    },
  ) {
    // Verify conversation exists and user owns it
    const conversation = await chatRepository.findConversationById(conversationId, organizationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    // Create user message
    const userMessage = await chatRepository.createMessage({
      conversationId,
      role: 'user',
      content: data.content,
      userId,
    });

    // Get conversation history for context
    const recentMessages = await chatRepository.getRecentMessages(conversationId, 20);

    // Build messages array for AI (newest first from DB, reverse for chronological)
    const aiMessages: AIMessage[] = recentMessages.reverse().map((m) => ({
      role: m.role as AIMessage['role'],
      content: m.content,
    }));

    // Build dynamic system prompt with real-time organization context
    const contextData = await buildContext({ organizationId, userId });
    const baseSystemPrompt = conversation.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const enhancedSystemPrompt = `${baseSystemPrompt}

=== CURRENT ORGANIZATION DATA ===
${contextData}

INSTRUCTIONS:
- Use the above data to answer questions about the organization's actual state
- Reference specific numbers, names, and timestamps when relevant
- If data is not available in the context, say so clearly
- Never fabricate or guess numbers`;
    
    // Generate AI completion
    const completion = await aiService.complete({
      messages: aiMessages,
      model: data.model ?? conversation.model,
      systemPrompt: enhancedSystemPrompt,
      maxTokens: 2048,
      temperature: 0.7,
    });

    // Create assistant message
    const assistantMessage = await chatRepository.createMessage({
      conversationId,
      role: 'assistant',
      content: completion.content,
      userId,
      model: completion.model,
      tokenCount: completion.usage.totalTokens,
    });

    return {
      userMessage: {
        id: userMessage.id,
        conversationId: userMessage.conversationId,
        role: userMessage.role,
        content: userMessage.content,
        model: userMessage.model,
        tokenCount: userMessage.tokenCount,
        metadata: userMessage.metadata as Record<string, unknown> | null,
        createdAt: userMessage.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMessage.id,
        conversationId: assistantMessage.conversationId,
        role: assistantMessage.role,
        content: assistantMessage.content,
        model: assistantMessage.model,
        tokenCount: assistantMessage.tokenCount,
        metadata: assistantMessage.metadata as Record<string, unknown> | null,
        createdAt: assistantMessage.createdAt.toISOString(),
      },
      usage: completion.usage,
    };
  }

  /**
   * List messages in a conversation.
   */
  async listMessages(
    conversationId: string,
    userId: string,
    organizationId: string,
    params?: { page?: number; perPage?: number },
  ) {
    // Verify conversation exists and user owns it
    const conversation = await chatRepository.findConversationById(conversationId, organizationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    const { messages, total } = await chatRepository.listMessages({
      conversationId,
      ...params,
    });

    return {
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        model: m.model,
        tokenCount: m.tokenCount,
        metadata: m.metadata as Record<string, unknown> | null,
        createdAt: m.createdAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * Archive/unarchive a conversation.
   */
  async toggleArchive(
    conversationId: string,
    userId: string,
    organizationId: string,
  ) {
    const conversation = await chatRepository.findConversationById(conversationId, organizationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    await chatRepository.updateConversation(conversationId, organizationId, {
      isArchived: !conversation.isArchived,
    });

    return { isArchived: !conversation.isArchived };
  }

  /**
   * Delete a conversation.
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
    organizationId: string,
  ) {
    const conversation = await chatRepository.findConversationById(conversationId, organizationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    await chatRepository.deleteConversation(conversationId, organizationId);
  }

  /**
   * Rename a conversation.
   */
  async renameConversation(
    conversationId: string,
    userId: string,
    organizationId: string,
    title: string,
  ) {
    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }
    if (title.length > 200) {
      throw new BadRequestError('Title must be 200 characters or less');
    }

    const conversation = await chatRepository.findConversationById(conversationId, organizationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }
    if (conversation.userId !== userId) {
      throw new NotFoundError('Conversation not found');
    }

    await chatRepository.updateConversation(conversationId, organizationId, {
      title: title.trim(),
    });
  }

  /**
   * Get available AI models.
   */
  getAvailableModels() {
    return getAvailableModels();
  }

  /**
   * Get chat statistics for the organization.
   */
  async getStats(organizationId: string) {
    return chatRepository.getStats(organizationId);
  }
}

export const chatService = new ChatService();
