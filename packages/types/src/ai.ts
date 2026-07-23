// ── AI Provider types ─────────────────────────────────────────
// These types form the abstraction layer.
// Business logic uses ONLY these types, never SDK-specific types.

export type AIProvider = 'local' | 'bedrock';
export type EmbeddingProvider = 'local' | 'titan';
export type StorageProvider = 'local' | 's3';
export type KnowledgeProvider = 'custom' | 'bedrock-kb';

export type ModelConfig = {
  provider: AIProvider;
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
};

export type LocalModel =
  | 'llama3'
  | 'qwen2.5'
  | 'mistral'
  | 'deepseek-r1'
  | 'phi3';

export type BedrockModel =
  | 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  | 'anthropic.claude-3-haiku-20240307-v1:0'
  | 'amazon.nova-pro-v1:0'
  | 'amazon.nova-lite-v1:0';

export type EmbeddingModel = 'nomic-embed-text' | 'amazon.titan-embed-text-v2:0';

export type LLMMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type LLMRequest = {
  messages: LLMMessage[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  systemPrompt?: string;
};

export type LLMResponse = {
  content: string;
  model: string;
  provider: AIProvider;
  usage: TokenUsage;
  latencyMs: number;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd?: number;
};

export type EmbeddingRequest = {
  text: string;
  model?: string;
};

export type EmbeddingResponse = {
  embedding: number[];
  model: string;
  provider: EmbeddingProvider;
  dimensions: number;
};

// ── RAG types ─────────────────────────────────────────────────

export type DocumentChunk = {
  id: string;
  sourceId: string;
  sourceType: 'RESUME' | 'JOB_DESCRIPTION' | 'KNOWLEDGE_BASE';
  content: string;
  embedding?: number[];
  chunkIndex: number;
  metadata: Record<string, unknown>;
};

export type SimilaritySearchRequest = {
  query: string;
  topK?: number;
  threshold?: number;
  sourceType?: DocumentChunk['sourceType'];
};

export type SimilaritySearchResult = {
  chunk: DocumentChunk;
  score: number;
};
