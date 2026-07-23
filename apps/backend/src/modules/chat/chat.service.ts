import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { LLMProvider } from '../../infrastructure/providers/provider.interface';
import { ConfigService } from '@nestjs/config';
import type { SendMessageDto, CreateConversationDto } from './dto/chat.dto';
import type { MessageRole } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly defaultModel: string;

  constructor(
    private readonly chatRepo: ChatRepository,
    private readonly llmProvider: LLMProvider,
    private readonly config: ConfigService,
  ) {
    this.defaultModel = this.config.get<string>('OLLAMA_DEFAULT_MODEL', 'llama3');
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const activeProvider = this.config.get<string>('AI_PROVIDER', 'local');
    const model = dto.model || this.defaultModel;

    const conversation = await this.chatRepo.createConversation({
      userId,
      sessionId: dto.sessionId,
      title: dto.title || `Chat with ${model}`,
      model,
      provider: activeProvider,
    });

    this.logger.log(`Created conversation: ${conversation.id} for user ${userId}`);
    return conversation;
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.chatRepo.findConversationById(id, userId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async getConversations(userId: string) {
    return this.chatRepo.findConversationsByUserId(userId);
  }

  async deleteConversation(id: string, userId: string) {
    await this.getConversation(id, userId); // validates existence and ownership
    await this.chatRepo.deleteConversation(id, userId);
    this.logger.log(`Deleted conversation: ${id}`);
  }

  /**
   * Send a message and get a complete non-streaming response
   */
  async sendMessage(userId: string, dto: SendMessageDto) {
    const conversation = await this.getOrCreateConversation(userId, dto);
    const start = Date.now();

    // 1. Build context from history
    const history = await this.chatRepo.findConversationById(conversation.id, userId);
    const prevMessages = history?.messages ?? [];

    const messages = prevMessages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Add user's new message
    messages.push({ role: 'user', content: dto.content });

    // 2. Save user message to database
    const userMessageTokenCount = this.estimateTokens(dto.content);
    await this.chatRepo.createMessage({
      conversationId: conversation.id,
      role: 'user' as MessageRole,
      content: dto.content,
      tokenCount: userMessageTokenCount,
    });

    // 3. Call LLM Provider
    const response = await this.llmProvider.complete({
      messages,
      model: conversation.model,
    });

    const latencyMs = Date.now() - start;

    // 4. Save assistant response to database
    const assistantMessage = await this.chatRepo.createMessage({
      conversationId: conversation.id,
      role: 'assistant' as MessageRole,
      content: response.content,
      tokenCount: response.usage.outputTokens,
      latencyMs,
      model: conversation.model,
    });

    this.logger.debug(
      `Message completed: conv=${conversation.id}, latency=${latencyMs}ms, tokens=${response.usage.totalTokens}`,
    );

    return assistantMessage;
  }

  /**
   * Send a message and stream the response via Server-Sent Events (SSE)
   */
  async *sendMessageStream(userId: string, dto: SendMessageDto): AsyncGenerator<{ event: string; data: string }, void, unknown> {
    const conversation = await this.getOrCreateConversation(userId, dto);
    const start = Date.now();

    // 1. Build context from history
    const history = await this.chatRepo.findConversationById(conversation.id, userId);
    const prevMessages = history?.messages ?? [];

    const messages = prevMessages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Add user's new message
    messages.push({ role: 'user', content: dto.content });

    // 2. Save user message to database
    const userMessageTokenCount = this.estimateTokens(dto.content);
    await this.chatRepo.createMessage({
      conversationId: conversation.id,
      role: 'user' as MessageRole,
      content: dto.content,
      tokenCount: userMessageTokenCount,
    });

    // Send the conversation ID first so the client knows which conversation this belongs to
    yield { event: 'meta', data: JSON.stringify({ conversationId: conversation.id }) };

    // 3. Stream from LLM Provider
    let fullResponse = '';
    try {
      for await (const chunk of this.llmProvider.stream({
        messages,
        model: conversation.model,
      })) {
        fullResponse += chunk;
        yield { event: 'message', data: chunk };
      }
    } catch (error) {
      this.logger.error(`Error in LLM stream: ${(error as Error).message}`);
      yield { event: 'error', data: 'An error occurred during generation' };
      throw error;
    }

    const latencyMs = Date.now() - start;
    const assistantMessageTokenCount = this.estimateTokens(fullResponse);

    // 4. Persist the final consolidated assistant message
    await this.chatRepo.createMessage({
      conversationId: conversation.id,
      role: 'assistant' as MessageRole,
      content: fullResponse,
      tokenCount: assistantMessageTokenCount,
      latencyMs,
      model: conversation.model,
    });

    // Send final completion metadata
    yield {
      event: 'done',
      data: JSON.stringify({
        latencyMs,
        totalTokens: userMessageTokenCount + assistantMessageTokenCount,
      }),
    };
  }

  // ── Private Helpers ──────────────────────────────────────────

  private async getOrCreateConversation(userId: string, dto: SendMessageDto) {
    if (dto.conversationId) {
      return this.getConversation(dto.conversationId, userId);
    }

    if (dto.sessionId) {
      const existing = await this.chatRepo.findConversationBySessionId(dto.sessionId, userId);
      if (existing) return existing;
    }

    // Create a new one
    return this.createConversation(userId, {
      sessionId: dto.sessionId,
      title: dto.content.substring(0, 30) + '...',
      model: this.defaultModel,
    });
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
