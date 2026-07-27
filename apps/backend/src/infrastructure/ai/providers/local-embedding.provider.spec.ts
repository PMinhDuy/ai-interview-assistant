import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocalEmbeddingProvider } from './local-embedding.provider';

describe('LocalEmbeddingProvider', () => {
  let provider: LocalEmbeddingProvider;
  const mockBaseUrl = 'http://localhost:11434';
  const mockEmbeddingModel = 'nomic-embed-text';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalEmbeddingProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              if (key === 'OLLAMA_BASE_URL') return mockBaseUrl;
              if (key === 'OLLAMA_EMBEDDING_MODEL') return mockEmbeddingModel;
              if (key === 'EMBEDDING_DIMENSIONS') return 768;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<LocalEmbeddingProvider>(LocalEmbeddingProvider);
    jest.clearAllMocks();
  });

  describe('embed', () => {
    it('should generate embeddings via Ollama API', async () => {
      const mockVector = new Array(768).fill(0.1);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ embedding: mockVector }),
      });

      const result = await provider.embed({ text: 'Test embedding text' });

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/embeddings`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"prompt":"Test embedding text"'),
        }),
      );
      expect(result.embedding).toEqual(mockVector);
      expect(result.provider).toBe('local');
      expect(result.dimensions).toBe(768);
    });

    it('should throw error when Ollama embedding request fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal error'),
      });

      await expect(provider.embed({ text: 'Test' })).rejects.toThrow('Ollama Embedding API error');
    });
  });

  describe('embedBatch', () => {
    it('should batch embed multiple texts', async () => {
      const mockVector = new Array(768).fill(0.2);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ embedding: mockVector }),
      });

      const results = await provider.embedBatch(['Text 1', 'Text 2']);

      expect(results.length).toBe(2);
      expect(results[0]?.embedding).toEqual(mockVector);
      expect(results[1]?.embedding).toEqual(mockVector);
    });
  });
});
