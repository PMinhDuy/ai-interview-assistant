import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RAGService } from './rag.service';
import { TextChunkingService } from './text-chunking.service';
import { VectorStoreRepository } from '../repositories/vector-store.repository';
import { EmbeddingProvider } from '../../../infrastructure/providers/provider.interface';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

describe('RAGService', () => {
  let service: RAGService;
  let vectorStoreRepository: jest.Mocked<VectorStoreRepository>;
  let embeddingProvider: jest.Mocked<EmbeddingProvider>;

  beforeEach(async () => {
    const mockEmbeddingProvider = {
      embed: jest.fn().mockResolvedValue({
        embedding: new Array(768).fill(0.1),
        model: 'nomic-embed-text',
        provider: 'local',
        dimensions: 768,
      }),
      embedBatch: jest.fn().mockImplementation((texts: string[]) =>
        Promise.resolve(
          texts.map(() => ({
            embedding: new Array(768).fill(0.1),
            model: 'nomic-embed-text',
            provider: 'local',
            dimensions: 768,
          })),
        ),
      ),
      getDimensions: jest.fn().mockReturnValue(768),
      isAvailable: jest.fn().mockResolvedValue(true),
    };

    const mockVectorStoreRepository = {
      saveEmbedding: jest.fn().mockResolvedValue(undefined),
      saveBatch: jest.fn().mockResolvedValue(undefined),
      similaritySearch: jest.fn().mockResolvedValue([
        {
          chunk: {
            id: 'c1',
            sourceId: 'src_1',
            sourceType: 'RESUME',
            content: 'Experienced NestJS Backend Engineer',
            chunkIndex: 0,
            metadata: {},
          },
          score: 0.88,
        },
      ]),
      deleteBySource: jest.fn().mockResolvedValue(1),
    };

    const mockPrismaService = {
      resume: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'res_123',
          extractedText: 'Full Stack Engineer with NestJS and React experience',
          userId: 'user_1',
          filename: 'resume.pdf',
        }),
      },
      jobDescription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'jd_123',
          extractedText: 'Looking for a Senior Backend Developer proficient in TypeScript',
          userId: 'user_1',
          title: 'Senior Backend Developer',
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RAGService,
        TextChunkingService,
        { provide: EmbeddingProvider, useValue: mockEmbeddingProvider },
        { provide: VectorStoreRepository, useValue: mockVectorStoreRepository },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RAGService>(RAGService);
    vectorStoreRepository = module.get(VectorStoreRepository);
    embeddingProvider = module.get(EmbeddingProvider);
  });

  describe('ingestDocument', () => {
    it('should split text, embed chunks, and store embeddings in pgvector repository', async () => {
      const result = await service.ingestDocument({
        sourceId: 'src_1',
        sourceType: 'RESUME',
        text: 'Engineered high performance backend systems.',
      });

      expect(vectorStoreRepository.deleteBySource).toHaveBeenCalledWith('RESUME', 'src_1');
      expect(embeddingProvider.embedBatch).toHaveBeenCalled();
      expect(vectorStoreRepository.saveBatch).toHaveBeenCalled();
      expect(result.chunksCount).toBeGreaterThan(0);
    });
  });

  describe('retrieveContext', () => {
    it('should query embeddings and format returned context block', async () => {
      const result = await service.retrieveContext({
        query: 'NestJS experience',
        topK: 3,
      });

      expect(embeddingProvider.embed).toHaveBeenCalledWith({ text: 'NestJS experience' });
      expect(vectorStoreRepository.similaritySearch).toHaveBeenCalled();
      expect(result.formattedContext).toContain('--- BEGIN RETRIEVED CONTEXT ---');
      expect(result.formattedContext).toContain('Experienced NestJS Backend Engineer');
      expect(result.results).toHaveLength(1);
    });
  });
});
