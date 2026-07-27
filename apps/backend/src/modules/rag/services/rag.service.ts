import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EmbeddingProvider } from '../../../infrastructure/providers/provider.interface';
import { TextChunkingService } from './text-chunking.service';
import { VectorStoreRepository } from '../repositories/vector-store.repository';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { DocumentChunk, SimilaritySearchRequest, SimilaritySearchResult } from '@repo/types';

export interface IngestDocumentOptions {
  sourceId: string;
  sourceType: DocumentChunk['sourceType'];
  text: string;
  metadata?: Record<string, unknown>;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface RetrievedContext {
  formattedContext: string;
  results: SimilaritySearchResult[];
}

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly textChunkingService: TextChunkingService,
    private readonly vectorStoreRepository: VectorStoreRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Ingest raw document text into vector database (chunking -> embedding -> pgvector storage)
   */
  async ingestDocument(options: IngestDocumentOptions): Promise<{ chunksCount: number }> {
    this.logger.log(`Ingesting document sourceId=${options.sourceId} sourceType=${options.sourceType}`);

    // Remove old embeddings for this source first to allow re-indexing
    await this.vectorStoreRepository.deleteBySource(options.sourceType, options.sourceId);

    const chunks = this.textChunkingService.splitText(
      options.text,
      options.sourceId,
      options.sourceType,
      { chunkSize: options.chunkSize, chunkOverlap: options.chunkOverlap },
      options.metadata,
    );

    if (chunks.length === 0) {
      this.logger.warn(`Document ${options.sourceId} resulted in 0 text chunks`);
      return { chunksCount: 0 };
    }

    const texts = chunks.map((c) => c.content);
    const embeddingResponses = await this.embeddingProvider.embedBatch(texts);

    const saveItems = chunks.map((chunk, index) => {
      const embRes = embeddingResponses[index];
      if (!embRes) {
        throw new Error(`Embedding missing for chunk index ${index}`);
      }
      return {
        sourceType: chunk.sourceType,
        sourceId: chunk.sourceId,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        embedding: embRes.embedding,
        metadata: chunk.metadata,
        embeddingModel: embRes.model,
        embeddingProvider: embRes.provider,
      };
    });

    await this.vectorStoreRepository.saveBatch(saveItems);

    this.logger.log(`Successfully ingested ${chunks.length} chunks for ${options.sourceId}`);
    return { chunksCount: chunks.length };
  }

  /**
   * Ingest extracted text from a Resume
   */
  async ingestResume(resumeId: string): Promise<{ chunksCount: number }> {
    const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || !resume.extractedText) {
      throw new NotFoundException(`Resume ${resumeId} not found or missing extracted text`);
    }

    return this.ingestDocument({
      sourceId: resume.id,
      sourceType: 'RESUME',
      text: resume.extractedText,
      metadata: {
        userId: resume.userId,
        filename: resume.filename,
      },
    });
  }

  /**
   * Ingest extracted text from a Job Description
   */
  async ingestJobDescription(jobDescriptionId: string): Promise<{ chunksCount: number }> {
    const jd = await this.prisma.jobDescription.findUnique({ where: { id: jobDescriptionId } });
    if (!jd || !jd.extractedText) {
      throw new NotFoundException(`Job description ${jobDescriptionId} not found or missing text`);
    }

    return this.ingestDocument({
      sourceId: jd.id,
      sourceType: 'JOB_DESCRIPTION',
      text: jd.extractedText,
      metadata: {
        userId: jd.userId,
        title: jd.title,
        company: jd.company,
        techStack: jd.techStack,
      },
    });
  }

  /**
   * Search vector store and format context for prompt injection
   */
  async retrieveContext(request: SimilaritySearchRequest): Promise<RetrievedContext> {
    const embeddingRes = await this.embeddingProvider.embed({ text: request.query });
    const results = await this.vectorStoreRepository.similaritySearch(
      embeddingRes.embedding,
      request,
    );

    if (results.length === 0) {
      return { formattedContext: '', results: [] };
    }

    const contextBlocks = results.map(
      (res, idx) => `[Context Chunk ${idx + 1} (${res.chunk.sourceType}) - Similarity: ${(res.score * 100).toFixed(1)}%]:\n${res.chunk.content}`,
    );

    const formattedContext = `--- BEGIN RETRIEVED CONTEXT ---\n${contextBlocks.join('\n\n')}\n--- END RETRIEVED CONTEXT ---`;

    return {
      formattedContext,
      results,
    };
  }

  /**
   * Delete embeddings for a given source
   */
  async deleteEmbeddings(sourceType: DocumentChunk['sourceType'], sourceId: string): Promise<number> {
    return this.vectorStoreRepository.deleteBySource(sourceType, sourceId);
  }
}
