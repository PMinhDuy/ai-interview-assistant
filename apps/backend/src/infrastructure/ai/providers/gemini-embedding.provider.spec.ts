import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { GeminiEmbeddingProvider } from './gemini-embedding.provider';

describe('GeminiEmbeddingProvider', () => {
  let provider: GeminiEmbeddingProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiEmbeddingProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: string) => {
              if (key === 'GEMINI_API_KEY') return 'test-key';
              if (key === 'GEMINI_EMBEDDING_MODEL') return 'gemini-embedding-001';
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<GeminiEmbeddingProvider>(GeminiEmbeddingProvider);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should throw InternalServerErrorException if API key is missing', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('');
    const noKeyProvider = new GeminiEmbeddingProvider(configService);

    await expect(noKeyProvider.embed({ text: 'test text' })).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should successfully return embedding vector when API returns 200', async () => {
    const mockEmbedding = Array(768).fill(0.1);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        embedding: { values: mockEmbedding },
      }),
    } as unknown as Response);

    const res = await provider.embed({ text: 'hello world' });
    expect(res.embedding).toHaveLength(768);
    expect(res.provider).toBe('gemini');
    expect(res.model).toContain('gemini-embedding-001');
  });

  it('should return correct dimension count (768)', () => {
    expect(provider.getDimensions()).toBe(768);
  });
});
