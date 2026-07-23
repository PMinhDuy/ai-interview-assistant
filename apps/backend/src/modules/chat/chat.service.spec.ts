import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { LLMProvider } from '../../infrastructure/providers/provider.interface';
import { ConfigService } from '@nestjs/config';

// ── Mocks ─────────────────────────────────────────────────────

const mockChatRepository = {
  createConversation: jest.fn(),
  findConversationById: jest.fn(),
  findConversationBySessionId: jest.fn(),
  findConversationsByUserId: jest.fn(),
  createMessage: jest.fn(),
  deleteConversation: jest.fn(),
};

const mockLLMProvider = {
  complete: jest.fn(),
  stream: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: string) => {
    if (key === 'OLLAMA_DEFAULT_MODEL') return 'llama3';
    if (key === 'AI_PROVIDER') return 'local';
    return defaultValue;
  }),
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: ChatRepository, useValue: mockChatRepository },
        { provide: LLMProvider, useValue: mockLLMProvider },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a new conversation successfully', async () => {
      mockChatRepository.createConversation.mockResolvedValue({
        id: 'conv-123',
        userId: 'user-123',
        model: 'llama3',
      });

      const result = await service.createConversation('user-123', {
        title: 'New Chat',
      });

      expect(mockChatRepository.createConversation).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          title: 'New Chat',
          model: 'llama3',
        })
      );
      expect(result.id).toBe('conv-123');
    });
  });

  describe('sendMessage', () => {
    it('should append user message, fetch completion, and append assistant reply', async () => {
      mockChatRepository.findConversationById.mockResolvedValue({
        id: 'conv-123',
        model: 'llama3',
        messages: [],
      });
      mockLLMProvider.complete.mockResolvedValue({
        content: 'Response reply.',
        usage: { inputTokens: 5, outputTokens: 5, totalTokens: 10 },
      });
      mockChatRepository.createMessage.mockResolvedValue({ id: 'msg-reply' });

      const result = await service.sendMessage('user-123', {
        conversationId: 'conv-123',
        content: 'Hello assistant',
      });

      expect(mockChatRepository.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-123',
          role: 'user',
          content: 'Hello assistant',
        })
      );
      expect(mockLLMProvider.complete).toHaveBeenCalled();
      expect(mockChatRepository.createMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          conversationId: 'conv-123',
          role: 'assistant',
          content: 'Response reply.',
        })
      );
      expect(result.id).toBe('msg-reply');
    });
  });

  describe('sendMessageStream', () => {
    it('should yield stream chunks and persist the full response on completion', async () => {
      mockChatRepository.findConversationById.mockResolvedValue({
        id: 'conv-123',
        model: 'llama3',
        messages: [],
      });

      // Mock stream async generator
      async function* mockStreamGen() {
        yield 'Chunk 1';
        yield ' Chunk 2';
      }
      mockLLMProvider.stream.mockImplementation(mockStreamGen);
      mockChatRepository.createMessage.mockResolvedValue({ id: 'msg-any' });

      const stream = service.sendMessageStream('user-123', {
        conversationId: 'conv-123',
        content: 'Hello stream',
      });

      const events: { event: string; data: string }[] = [];
      for await (const chunk of stream) {
        events.push(chunk);
      }

      expect(events).toContainEqual({ event: 'meta', data: expect.stringContaining('conv-123') });
      expect(events).toContainEqual({ event: 'message', data: 'Chunk 1' });
      expect(events).toContainEqual({ event: 'message', data: ' Chunk 2' });
      expect(events).toContainEqual({ event: 'done', data: expect.any(String) });

      // Ensure consolidated message is saved
      expect(mockChatRepository.createMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          conversationId: 'conv-123',
          role: 'assistant',
          content: 'Chunk 1 Chunk 2',
        })
      );
    });
  });
});
