import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { DocumentChunk, SimilaritySearchRequest, SimilaritySearchResult } from '@repo/types';

export interface SaveEmbeddingParams {
  id?: string;
  sourceType: DocumentChunk['sourceType'];
  sourceId: string;
  content: string;
  chunkIndex: number;
  embedding: number[];
  metadata?: Record<string, unknown>;
  embeddingModel: string;
  embeddingProvider: string;
}

@Injectable()
export class VectorStoreRepository {
  private readonly logger = new Logger(VectorStoreRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a single chunk embedding into pgvector table
   */
  async saveEmbedding(params: SaveEmbeddingParams): Promise<void> {
    const vectorStr = `[${params.embedding.join(',')}]`;
    const metadataJson = JSON.stringify(params.metadata ?? {});

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "embeddings" (
        "id",
        "sourceType",
        "sourceId",
        "content",
        "chunkIndex",
        "vector",
        "metadata",
        "embeddingModel",
        "embeddingProvider",
        "createdAt"
      )
      VALUES (
        uuid_generate_v4(),
        $1::"EmbeddingSourceType",
        $2::uuid,
        $3,
        $4,
        $5::vector,
        $6::jsonb,
        $7,
        $8,
        NOW()
      )
      `,
      params.sourceType,
      params.sourceId,
      params.content,
      params.chunkIndex,
      vectorStr,
      metadataJson,
      params.embeddingModel,
      params.embeddingProvider,
    );
  }

  /**
   * Save a batch of chunk embeddings in a transaction
   */
  async saveBatch(embeddings: SaveEmbeddingParams[]): Promise<void> {
    for (const item of embeddings) {
      await this.saveEmbedding(item);
    }
  }

  /**
   * Perform cosine similarity search using pgvector operator (<=>)
   */
  async similaritySearch(
    queryVector: number[],
    request: SimilaritySearchRequest,
  ): Promise<SimilaritySearchResult[]> {
    const vectorStr = `[${queryVector.join(',')}]`;
    const topK = request.topK ?? 5;
    const threshold = request.threshold ?? 0.0;

    let rows: Array<{
      id: string;
      sourceType: DocumentChunk['sourceType'];
      sourceId: string;
      content: string;
      chunkIndex: number;
      metadata: Record<string, unknown>;
      similarity: number;
    }> = [];

    if (request.sourceType) {
      rows = await this.prisma.$queryRawUnsafe(
        `
        SELECT 
          "id",
          "sourceType",
          "sourceId",
          "content",
          "chunkIndex",
          "metadata",
          (1 - ("vector" <=> $1::vector)) AS "similarity"
        FROM "embeddings"
        WHERE "sourceType" = $2::"EmbeddingSourceType"
          AND (1 - ("vector" <=> $1::vector)) >= $3
        ORDER BY "vector" <=> $1::vector ASC
        LIMIT $4
        `,
        vectorStr,
        request.sourceType,
        threshold,
        topK,
      );
    } else {
      rows = await this.prisma.$queryRawUnsafe(
        `
        SELECT 
          "id",
          "sourceType",
          "sourceId",
          "content",
          "chunkIndex",
          "metadata",
          (1 - ("vector" <=> $1::vector)) AS "similarity"
        FROM "embeddings"
        WHERE (1 - ("vector" <=> $1::vector)) >= $2
        ORDER BY "vector" <=> $1::vector ASC
        LIMIT $3
        `,
        vectorStr,
        threshold,
        topK,
      );
    }

    return rows.map((row) => ({
      chunk: {
        id: row.id,
        sourceId: row.sourceId,
        sourceType: row.sourceType,
        content: row.content,
        chunkIndex: row.chunkIndex,
        metadata: row.metadata ?? {},
      },
      score: Number(row.similarity),
    }));
  }

  /**
   * Delete embeddings for a specific document source
   */
  async deleteBySource(sourceType: DocumentChunk['sourceType'], sourceId: string): Promise<number> {
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "embeddings" WHERE "sourceType" = $1::"EmbeddingSourceType" AND "sourceId" = $2::uuid`,
      sourceType,
      sourceId,
    );
    return Number(result);
  }
}
