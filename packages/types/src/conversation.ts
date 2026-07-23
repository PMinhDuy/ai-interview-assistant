// ── Conversation / Chat types ────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export type Message = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  latencyMs?: number;
  model?: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  sessionId?: string;
  title?: string;
  model: string;
  provider: string;
  messages: Message[];
  totalTokens: number;
  createdAt: string;
  updatedAt: string;
};

export type SendMessageRequest = {
  content: string;
  conversationId?: string;
  sessionId?: string;
};

export type StreamChunk = {
  id: string;
  content: string;
  done: boolean;
  model?: string;
};
