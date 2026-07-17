import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ConversationListParams } from '../../api/chat';
import type { CreateConversationRequestDTO, SendMessageRequestDTO } from '@vestara/types';

export const chatKeys = {
  all: ['chat'] as const,
  models: () => [...chatKeys.all, 'models'] as const,
  conversations: (params?: ConversationListParams) =>
    [...chatKeys.all, 'conversations', params] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversations', id] as const,
  messages: (conversationId: string, params?: { page?: number; perPage?: number }) =>
    [...chatKeys.all, 'conversations', conversationId, 'messages', params] as const,
  stats: () => [...chatKeys.all, 'stats'] as const,
};

/**
 * Get available AI models.
 */
export function useChatModels() {
  return useQuery({
    queryKey: chatKeys.models(),
    queryFn: () => chatApi.getModels(),
  });
}

/**
 * List user's conversations.
 */
export function useConversations(params?: ConversationListParams) {
  return useQuery({
    queryKey: chatKeys.conversations(params),
    queryFn: () => chatApi.listConversations(params),
  });
}

/**
 * Get a single conversation by ID.
 */
export function useConversation(id: string) {
  return useQuery({
    queryKey: chatKeys.conversation(id),
    queryFn: () => chatApi.getConversation(id),
    enabled: !!id,
  });
}

/**
 * List messages in a conversation.
 */
export function useChatMessages(
  conversationId: string,
  params?: { page?: number; perPage?: number },
) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId, params),
    queryFn: () => chatApi.listMessages(conversationId, params),
    enabled: !!conversationId,
  });
}

/**
 * Create a new conversation.
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConversationRequestDTO) => chatApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

/**
 * Send a message in a conversation.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: SendMessageRequestDTO;
    }) => chatApi.sendMessage(conversationId, data),
    onSuccess: (_result, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.conversationId),
      });
      // Invalidate conversation list (for lastMessage update)
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      });
      // Invalidate the conversation detail
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversation(variables.conversationId),
      });
    },
  });
}

/**
 * Rename a conversation.
 */
export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      chatApi.renameConversation(id, title),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversation(variables.id) });
    },
  });
}

/**
 * Toggle archive status.
 */
export function useToggleArchive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatApi.toggleArchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

/**
 * Delete a conversation.
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

/**
 * Get chat statistics.
 */
export function useChatStats() {
  return useQuery({
    queryKey: chatKeys.stats(),
    queryFn: () => chatApi.getStats(),
  });
}
