import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { getConversationsQueryOptions } from './get-conversations';

export const deleteConversation = async (id: string): Promise<void> => {
  await apiClient.delete(`/chat/conversation/${id}`);
};

export const useDeleteConversationMutation = (onSuccessCallback?: (deletedId: string) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries(getConversationsQueryOptions());
      onSuccessCallback?.(deletedId);
    },
  });
};
