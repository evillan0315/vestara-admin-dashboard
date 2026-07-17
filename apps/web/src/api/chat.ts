import { apiClient } from './client';
import type {
  ChatConversationDTO,
  ChatMessageDTO,
  CreateConversationRequestDTO,
  SendMessageRequestDTO,
  ChatCompletionDTO,
  ChatModelsDTO,
  PaginationMeta,
} from '@vestara/types';

export interface ConversationListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isArchived?: boolean;
}

export interface MessageListParams {
  page?: number;
  perPage?: number;
}

/**
 * Chat API Client
 *
 * Provides typed methods for all chat-related API endpoints.
 */
export const chatApi = {
  /**
   * Get available AI models.
   */
  async getModels(): Promise<ChatModelsDTO['models']> {
    const res = await apiClient.get<ChatModelsDTO>('/chat/models');
    return res.data?.models ?? [];
  },

  /**
   * List user's conversations.
   */
  async listConversations(params?: ConversationListParams): Promise<{
    conversations: ChatConversationDTO[];
    pagination: PaginationMeta;
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.perPage) query.set('perPage', String(params.perPage));
    if (params?.search) query.set('search', params.search);
    if (params?.isArchived !== undefined) query.set('isArchived', String(params.isArchived));

    const qs = query.toString();
    const res = await apiClient.get<{
      conversations: ChatConversationDTO[];
      pagination: PaginationMeta;
    }>(`/chat/conversations${qs ? `?${qs}` : ''}`);

    return (
      res.data ?? {
        conversations: [],
        pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 },
      }
    );
  },

  /**
   * Create a new conversation.
   */
  async createConversation(data: CreateConversationRequestDTO): Promise<ChatConversationDTO> {
    const res = await apiClient.post<{ conversation: ChatConversationDTO }>(
      '/chat/conversations',
      data,
    );
    if (!res.data?.conversation) {
      throw new Error('Failed to create conversation');
    }
    return res.data.conversation;
  },

  /**
   * Get a conversation by ID.
   */
  async getConversation(id: string): Promise<ChatConversationDTO> {
    const res = await apiClient.get<{ conversation: ChatConversationDTO }>(
      `/chat/conversations/${id}`,
    );
    if (!res.data?.conversation) {
      throw new Error('Conversation not found');
    }
    return res.data.conversation;
  },

  /**
   * Rename a conversation.
   */
  async renameConversation(id: string, title: string): Promise<void> {
    await apiClient.put(`/chat/conversations/${id}`, { title });
  },

  /**
   * Toggle archive status.
   */
  async toggleArchive(id: string): Promise<{ isArchived: boolean }> {
    const res = await apiClient.patch<{ isArchived: boolean }>(`/chat/conversations/${id}/archive`);
    return res.data ?? { isArchived: false };
  },

  /**
   * Delete a conversation.
   */
  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/chat/conversations/${id}`);
  },

  /**
   * List messages in a conversation.
   */
  async listMessages(
    conversationId: string,
    params?: MessageListParams,
  ): Promise<{
    messages: ChatMessageDTO[];
    pagination: PaginationMeta;
  }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.perPage) query.set('perPage', String(params.perPage));

    const qs = query.toString();
    const res = await apiClient.get<{
      messages: ChatMessageDTO[];
      pagination: PaginationMeta;
    }>(`/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);

    return (
      res.data ?? { messages: [], pagination: { page: 1, perPage: 50, total: 0, totalPages: 0 } }
    );
  },

  /**
   * Send a message and get AI response.
   */
  async sendMessage(
    conversationId: string,
    data: SendMessageRequestDTO,
  ): Promise<ChatCompletionDTO> {
    const res = await apiClient.post<ChatCompletionDTO>(
      `/chat/conversations/${conversationId}/messages`,
      data,
    );
    if (!res.data) {
      throw new Error('Failed to send message');
    }
    return res.data;
  },

  /**
   * Get chat statistics.
   */
  async getStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    activeConversations: number;
  }> {
    const res = await apiClient.get<{
      stats: {
        totalConversations: number;
        totalMessages: number;
        activeConversations: number;
      };
    }>('/chat/stats');
    return res.data?.stats ?? { totalConversations: 0, totalMessages: 0, activeConversations: 0 };
  },
};

export default chatApi;
