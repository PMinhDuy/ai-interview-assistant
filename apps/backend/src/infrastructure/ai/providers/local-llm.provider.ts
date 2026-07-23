import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider } from '../../providers/provider.interface';
import type { LLMRequest, LLMResponse, TokenUsage } from '@repo/types';

/**
 * LocalLLMProvider (Ollama)
 *
 * Implements LLMProvider interface for local LLM execution.
 * Connects to Ollama running locally (typically http://localhost:11434).
 *
 * AIP-C01 Note:
 *   Ollama operates as a local replica of Amazon Bedrock Runtime.
 *   - Both take messages, system prompts, temperature, maxTokens.
 *   - Both support streaming responses.
 *   - Local cost = $0/token. Bedrock cost = pay-per-token.
 */
@Injectable()
export class LocalLLMProvider extends LLMProvider {
  private readonly logger = new Logger(LocalLLMProvider.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.baseUrl = this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    this.defaultModel = this.config.get<string>('OLLAMA_DEFAULT_MODEL', 'llama3');
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const model = request.model || this.defaultModel;

    // Combine system prompt if provided
    const messages = [...request.messages];
    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        message: { content: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      const latencyMs = Date.now() - start;

      // Ollama returns exact prompt eval tokens (input) and eval tokens (output)
      const inputTokens = data.prompt_eval_count ?? this.estimateTokens(JSON.stringify(messages));
      const outputTokens = data.eval_count ?? this.estimateTokens(data.message.content);

      const usage: TokenUsage = {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCostUsd: 0, // local is free!
      };

      return {
        content: data.message.content,
        model,
        provider: 'local',
        usage,
        latencyMs,
      };
    } catch (error) {
      this.logger.error(`Ollama completion failed for model ${model}`, (error as Error).stack);
      throw error;
    }
  }

  /**
   * Stream response from Ollama using an Async Generator
   */
  async *stream(request: LLMRequest): AsyncGenerator<string, void, unknown> {
    const model = request.model || this.defaultModel;
    const messages = [...request.messages];
    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Streaming API error (${response.status}): ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Ollama streaming response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const parsed = JSON.parse(line) as {
              message?: { content: string };
              done: boolean;
              prompt_eval_count?: number;
              eval_count?: number;
            };

            if (parsed.message?.content) {
              yield parsed.message.content;
            }
          }
        }

        // Process any remaining text in the buffer
        if (buffer.trim()) {
          const parsed = JSON.parse(buffer) as { message?: { content: string } };
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      this.logger.error(`Ollama stream failed for model ${model}`, (error as Error).stack);
      throw error;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = (await response.json()) as { models: { name: string }[] };
      return data.models.map((m) => m.name);
    } catch {
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Simple fallback tokenizer (approx 4 chars = 1 token)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
