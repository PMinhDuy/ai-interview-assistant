'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, message } from 'antd';
import {
  getConversationsQueryOptions,
  getConversationQueryOptions,
  useCreateConversationMutation,
  useDeleteConversationMutation,
  useSendMessageMutation,
  type ChatMessage,
} from '../api';
import { extractApiErrorMessage } from '@/lib/error';
import { ConversationSidebar } from './ConversationSidebar';
import { ChatMessagePane } from './ChatMessagePane';

export function ChatView() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Conversations List Query
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery(
    getConversationsQueryOptions(),
  );

  // Active Conversation Query
  const { data: activeConversation, isLoading: isLoadingMessages } = useQuery(
    getConversationQueryOptions(selectedConversationId),
  );

  // Mutations
  const createConversationMutation = useCreateConversationMutation((newConv) => {
    setSelectedConversationId(newConv.id);
  });

  const deleteConversationMutation = useDeleteConversationMutation((deletedId) => {
    message.success('Conversation deleted');
    if (selectedConversationId === deletedId) {
      setSelectedConversationId(null);
    }
  });

  const sendMessageMutation = useSendMessageMutation(selectedConversationId, (result) => {
    if (selectedConversationId !== result.resolvedConversationId) {
      setSelectedConversationId(result.resolvedConversationId);
    }
  });

  const handleCreate = async () => {
    try {
      await createConversationMutation.mutateAsync('Interview Prep');
    } catch (error: unknown) {
      message.error(extractApiErrorMessage(error, 'Failed to create new conversation'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversationMutation.mutateAsync(id);
    } catch (error: unknown) {
      message.error(extractApiErrorMessage(error, 'Failed to delete conversation'));
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content,
      });
    } catch (error: unknown) {
      message.error(extractApiErrorMessage(error, 'Failed to send message'));
    }
  };

  const messages: ChatMessage[] = activeConversation?.messages || [];

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <Row gutter={16} style={{ height: '100%' }}>
        <Col xs={24} sm={8} md={6} style={{ height: '100%' }}>
          <ConversationSidebar
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            isLoading={isLoadingConversations}
            isCreating={createConversationMutation.isPending}
            onSelectConversation={setSelectedConversationId}
            onCreateConversation={handleCreate}
            onDeleteConversation={handleDelete}
          />
        </Col>

        <Col xs={24} sm={16} md={18} style={{ height: '100%' }}>
          <ChatMessagePane
            messages={messages}
            isLoading={isLoadingMessages}
            isSending={sendMessageMutation.isPending}
            onSendMessage={handleSendMessage}
          />
        </Col>
      </Row>
    </div>
  );
}
