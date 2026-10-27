import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ConversationItem } from './types';

export const getConversations = async (): Promise<ConversationItem[]> => {
  const { data } = await apiClient.get<ConversationItem[]>('/chat/conversations');
  return data;
};

export const getConversationsQueryOptions = () =>
  queryOptions({
    queryKey: ['chat-conversations'],
    queryFn: getConversations,
  });
