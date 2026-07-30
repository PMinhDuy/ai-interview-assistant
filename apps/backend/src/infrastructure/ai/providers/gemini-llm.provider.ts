import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider } from '../../providers/provider.interface';
import type { LLMRequest, LLMResponse } from '@repo/types';

/**
 * GeminiLLMProvider
 *
 * Generates text completions using Google AI Studio Gemini API (`gemini-flash-latest` / `gemini-2.0-flash`).
 * 
 * Features:
 *   - 0 MB local RAM usage (Cloud-based LLM)
 *   - Extremely fast response times (< 1 second)
 *   - Free tier generous quota
 */
@Injectable()
export class GeminiLLMProvider extends LLMProvider {
  private readonly logger = new Logger(GeminiLLMProvider.name);
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.defaultModel = this.config.get<string>('GEMINI_MODEL', 'gemini-flash-latest');
  }

  private getApiKey(): string {
    return (
      this.config.get<string>('GEMINI_API_KEY') ||
      this.config.get<string>('GOOGLE_AI_STUDIO_API_KEY') ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_STUDIO_API_KEY ||
      ''
    );
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY or GOOGLE_AI_STUDIO_API_KEY is missing in environment variables',
      );
    }

    const startMs = Date.now();
    let model = request.model && !request.model.includes('llama') && !request.model.includes('qwen')
      ? request.model
      : this.defaultModel;
      
    if (!model.startsWith('models/')) {
      model = `models/${model}`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`;

    // Extract system prompt if present
    let systemInstructionText = request.systemPrompt || '';
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        systemInstructionText += (systemInstructionText ? '\n' : '') + msg.content;
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const bodyPayload: Record<string, unknown> = { contents };

    if (systemInstructionText) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstructionText }],
      };
    }

    if (request.temperature !== undefined || request.maxTokens !== undefined) {
      bodyPayload.generationConfig = {
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.maxTokens !== undefined ? { maxOutputTokens: request.maxTokens } : {}),
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google AI Studio API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const candidate = data.candidates?.[0];
      const outputText = candidate?.content?.parts?.[0]?.text || '';
      const latencyMs = Date.now() - startMs;

      const inputTokens = data.usageMetadata?.promptTokenCount || Math.ceil(JSON.stringify(contents).length / 4);
      const outputTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(outputText.length / 4);

      return {
        content: outputText,
        model,
        provider: 'gemini',
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        latencyMs,
      };
    } catch (error) {
      this.logger.error(`Gemini LLM complete failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async *stream(request: LLMRequest): AsyncIterable<string> {
    const response = await this.complete(request);
    yield response.content;
  }

  async listModels(): Promise<string[]> {
    return ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-pro'];
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.getApiKey());
  }
}
