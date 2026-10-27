import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ChatMessage, ConversationItem } from './types';
import { getConversationsQueryOptions } from './get-conversations';
import { getConversationQueryOptions } from './get-conversation';
import { createConversation } from './create-conversation';

export interface SendMessageParams {
  conversationId: string | null;
  content: string;
}

export interface SendMessageResult {
  message: ChatMessage;
  resolvedConversationId: string;
}

export const sendMessage = async ({
  conversationId,
  content,
}: SendMessageParams): Promise<SendMessageResult> => {
  let activeId = conversationId;
  if (!activeId) {
    const newConv: ConversationItem = await createConversation('Interview Prep Chat');
    activeId = newConv.id;
  }

  const { data } = await apiClient.post<ChatMessage>('/chat/message', {
    conversationId: activeId,
    content,
  });

  return {
    message: data,
    resolvedConversationId: activeId,
  };
};

export const useSendMessageMutation = (
  currentConversationId: string | null,
  onSuccessCallback?: (result: SendMessageResult) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (result) => {
      queryClient.invalidateQueries(getConversationQueryOptions(result.resolvedConversationId));
      queryClient.invalidateQueries(getConversationsQueryOptions());
      onSuccessCallback?.(result);
    },
  });
};
