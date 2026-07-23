/**
 * Abstract AI Provider Interfaces
 *
 * These interfaces are the CORE of our Clean Architecture.
 * Business logic depends ONLY on these interfaces, never on
 * Ollama SDK or AWS SDK directly.
 *
 * AIP-C01 Pattern:
 *   This is the "Adapter" pattern — we can swap AWS Bedrock for Ollama
 *   without changing a single line of business code.
 *
 * Dependency Inversion Principle (SOLID):
 *   High-level modules (InterviewService) depend on abstractions (LLMProvider)
 *   not concretions (OllamaProvider, BedrockProvider)
 */

import type { LLMRequest, LLMResponse, EmbeddingRequest, EmbeddingResponse } from '@repo/types';

// ── LLM Provider ──────────────────────────────────────────────
export abstract class LLMProvider {
  abstract complete(request: LLMRequest): Promise<LLMResponse>;
  abstract stream(request: LLMRequest): AsyncIterable<string>;
  abstract listModels(): Promise<string[]>;
  abstract isAvailable(): Promise<boolean>;
}

// ── Embedding Provider ────────────────────────────────────────
export abstract class EmbeddingProvider {
  abstract embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  abstract embedBatch(texts: string[]): Promise<EmbeddingResponse[]>;
  abstract getDimensions(): number;
  abstract isAvailable(): Promise<boolean>;
}

// ── Storage Provider ──────────────────────────────────────────
export abstract class StorageProvider {
  abstract upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  abstract download(key: string): Promise<Buffer>;
  abstract delete(key: string): Promise<void>;
  abstract getUrl(key: string): string;
  abstract exists(key: string): Promise<boolean>;
}

// ── Knowledge Provider (RAG) ──────────────────────────────────
export abstract class KnowledgeProvider {
  abstract query(question: string, options?: { topK?: number; threshold?: number }): Promise<string[]>;
  abstract ingest(content: string, metadata: Record<string, unknown>): Promise<string>;
  abstract isAvailable(): Promise<boolean>;
}
