import { Injectable, NotImplementedException } from '@nestjs/common';
import { LLMProvider } from '../../providers/provider.interface';
import type { LLMRequest, LLMResponse } from '@repo/types';

/**
 * BedrockProvider (Optional AWS Bedrock integration)
 *
 * Implemented in Phase 9.
 * This class serves as a stub for Phase 3 to satisfy module binding.
 */
@Injectable()
export class BedrockProvider extends LLMProvider {
  complete(_request: LLMRequest): Promise<LLMResponse> {
    throw new NotImplementedException('BedrockProvider is implemented in Phase 9. Set AI_PROVIDER=local.');
  }

   
  async *stream(_request: LLMRequest): AsyncGenerator<string, void, unknown> {
    throw new NotImplementedException('BedrockProvider is implemented in Phase 9. Set AI_PROVIDER=local.');
  }

  listModels(): Promise<string[]> {
    return Promise.resolve([
      'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'anthropic.claude-3-haiku-20240307-v1:0',
      'amazon.nova-pro-v1:0',
      'amazon.nova-lite-v1:0',
    ]);
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
