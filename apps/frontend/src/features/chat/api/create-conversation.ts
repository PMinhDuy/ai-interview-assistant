import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ConversationItem } from './types';
import { getConversationsQueryOptions } from './get-conversations';

export const createConversation = async (title?: string): Promise<ConversationItem> => {
  const { data } = await apiClient.post<ConversationItem>('/chat/conversation', {
    title: title || 'New Chat',
  });
  return data;
};

export const useCreateConversationMutation = (onSuccessCallback?: (newConv: ConversationItem) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: (newConv) => {
      queryClient.invalidateQueries(getConversationsQueryOptions());
      onSuccessCallback?.(newConv);
    },
  });
};
