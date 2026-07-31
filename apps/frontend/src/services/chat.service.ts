import { apiClient } from '../lib/axios';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export const chatService = {
  async createConversation(title?: string): Promise<ConversationItem> {
    const { data } = await apiClient.post<ConversationItem>('/chat/conversation', { title: title || 'New Chat' });
    return data;
  },

  async getConversations(): Promise<ConversationItem[]> {
    const { data } = await apiClient.get<ConversationItem[]>('/chat/conversations');
    return data;
  },

  async getConversation(id: string): Promise<ConversationItem> {
    const { data } = await apiClient.get<ConversationItem>(`/chat/conversation/${id}`);
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/chat/conversation/${id}`);
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const { data } = await apiClient.post<ChatMessage>('/chat/message', { conversationId, content });
    return data;
  },
};
