import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../../providers/provider.interface';
import type { EmbeddingRequest, EmbeddingResponse } from '@repo/types';

/**
 * LocalEmbeddingProvider (Ollama)
 *
 * Implements EmbeddingProvider interface for local vector embeddings.
 * Defaults to `nomic-embed-text` model (768 dimensions).
 */
@Injectable()
export class LocalEmbeddingProvider extends EmbeddingProvider {
  private readonly logger = new Logger(LocalEmbeddingProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly dimensions: number;

  constructor(private readonly config: ConfigService) {
    super();
    this.baseUrl = this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    this.defaultModel = this.config.get<string>('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text');
    this.dimensions = this.config.get<number>('EMBEDDING_DIMENSIONS', 768);
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || this.defaultModel;

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: request.text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Embedding API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as { embedding: number[] };

      return {
        embedding: data.embedding,
        model,
        provider: 'local',
        dimensions: data.embedding.length || this.dimensions,
      };
    } catch (error) {
      this.logger.error(`Ollama embedding generation failed for model ${model}`, (error as Error).stack);
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResponse[]> {
    return Promise.all(texts.map((text) => this.embed({ text })));
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch {
      return false;
    }
  }
}
