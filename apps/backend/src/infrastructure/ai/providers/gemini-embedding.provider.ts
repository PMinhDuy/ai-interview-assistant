import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../../providers/provider.interface';
import type { EmbeddingRequest, EmbeddingResponse } from '@repo/types';

/**
 * GeminiEmbeddingProvider
 *
 * Generates embeddings using Google AI Studio Gemini Embeddings API (`gemini-embedding-001`).
 * 
 * Features:
 *   - 0 MB local RAM usage (Cloud-based API)
 *   - 100% FREE (Up to 1,500 requests/min on Google AI Studio Free Tier)
 *   - Configured outputDimensionality=768 to match PostgreSQL pgvector schema
 */
@Injectable()
export class GeminiEmbeddingProvider extends EmbeddingProvider {
  private readonly logger = new Logger(GeminiEmbeddingProvider.name);
  private readonly defaultModel: string;
  private readonly dimensions: number;

  constructor(private readonly config: ConfigService) {
    super();
    this.defaultModel = this.config.get<string>('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-001');
    this.dimensions = this.config.get<number>('EMBEDDING_DIMENSIONS', 768);
  }

  private getApiKey(): string {
    return (
      this.config.get<string>('GEMINI_API_KEY') ||
      this.config.get<string>('GOOGLE_AI_STUDIO_API_KEY') ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_API_KEY ||
      ''
    );
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY or GOOGLE_AI_STUDIO_API_KEY is missing in environment variables',
      );
    }

    let model = request.model || this.defaultModel;
    if (!model.startsWith('models/')) {
      model = `models/${model}`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:embedContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            parts: [{ text: request.text }],
          },
          outputDimensionality: this.dimensions,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google AI Studio API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as { embedding: { values: number[] } };

      return {
        embedding: data.embedding.values,
        model,
        provider: 'gemini',
        dimensions: data.embedding.values.length || this.dimensions,
      };
    } catch (error) {
      this.logger.error(`Gemini embed failed: ${(error as Error).message}`);
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
    return Boolean(this.getApiKey());
  }
}
