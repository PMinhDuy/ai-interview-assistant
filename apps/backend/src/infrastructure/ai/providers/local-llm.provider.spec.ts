import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocalLLMProvider } from './local-llm.provider';

describe('LocalLLMProvider', () => {
  let provider: LocalLLMProvider;
  const mockBaseUrl = 'http://localhost:11434';
  const mockDefaultModel = 'llama3';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalLLMProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'OLLAMA_BASE_URL') return mockBaseUrl;
              if (key === 'OLLAMA_DEFAULT_MODEL') return mockDefaultModel;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<LocalLLMProvider>(LocalLLMProvider);
    jest.clearAllMocks();
  });

  describe('complete', () => {
    it('should invoke Ollama chat completion and return response details', async () => {
      const mockResponse = {
        message: { content: 'This is the completion response.' },
        prompt_eval_count: 10,
        eval_count: 20,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await provider.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama3',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseUrl}/api/chat`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"model":"llama3"'),
        })
      );
      expect(result.content).toBe('This is the completion response.');
      expect(result.usage.inputTokens).toBe(10);
      expect(result.usage.outputTokens).toBe(20);
      expect(result.usage.totalTokens).toBe(30);
    });

    it('should throw error if response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      await expect(
        provider.complete({
          messages: [{ role: 'user', content: 'Hello' }],
          model: 'llama3',
        })
      ).rejects.toThrow('Ollama API error');
    });
  });

  describe('stream', () => {
    it('should stream response chunks from Ollama response stream', async () => {
      // Mock stream reader
      const encoder = new TextEncoder();
      const chunks = [
        JSON.stringify({ message: { content: 'Part 1, ' }, done: false }),
        JSON.stringify({ message: { content: 'Part 2.' }, done: true }),
      ];

      const readableStream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk) => {
            controller.enqueue(encoder.encode(chunk + '\n'));
          });
          controller.close();
        },
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: readableStream,
      });

      const generator = provider.stream({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'llama3',
      });

      const resultChunks: string[] = [];
      for await (const chunk of generator) {
        resultChunks.push(chunk);
      }

      expect(resultChunks).toEqual(['Part 1, ', 'Part 2.']);
    });
  });
});
