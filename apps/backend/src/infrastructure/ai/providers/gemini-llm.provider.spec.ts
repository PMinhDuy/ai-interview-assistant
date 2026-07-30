import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { GeminiLLMProvider } from './gemini-llm.provider';

describe('GeminiLLMProvider', () => {
  let provider: GeminiLLMProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiLLMProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: string) => {
              if (key === 'GEMINI_API_KEY') return 'test-key';
              if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<GeminiLLMProvider>(GeminiLLMProvider);
    configService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should throw InternalServerErrorException if API key is missing', async () => {
    jest.spyOn(configService, 'get').mockReturnValue('');
    const noKeyProvider = new GeminiLLMProvider(configService);

    await expect(
      noKeyProvider.complete({
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gemini-2.5-flash',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should successfully complete LLM prompt when API returns 200', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: 'Here are 5 technical questions...' }],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 50,
          candidatesTokenCount: 100,
          totalTokenCount: 150,
        },
      }),
    } as unknown as Response);

    const res = await provider.complete({
      messages: [{ role: 'user', content: 'Generate questions' }],
      model: 'gemini-2.5-flash',
    });

    expect(res.content).toBe('Here are 5 technical questions...');
    expect(res.provider).toBe('gemini');
    expect(res.usage.totalTokens).toBe(150);
  });
});
