import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ConversationItem } from './types';

export const getConversation = async (id: string): Promise<ConversationItem> => {
  const { data } = await apiClient.get<ConversationItem>(`/chat/conversation/${id}`);
  return data;
};

export const getConversationQueryOptions = (id: string | null) =>
  queryOptions({
    queryKey: ['chat-conversation', id],
    queryFn: () => (id ? getConversation(id) : null),
    enabled: Boolean(id),
  });
