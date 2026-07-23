import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider } from '../providers/provider.interface';
import { LocalLLMProvider } from './providers/local-llm.provider';
import { BedrockProvider } from './providers/bedrock.provider';

/**
 * AIModule — Provider Factory
 *
 * Exposes the active LLMProvider and EmbeddingProvider.
 * Toggled via AI_PROVIDER environment variable.
 */
@Global()
@Module({
  providers: [
    LocalLLMProvider,
    BedrockProvider,
    {
      provide: LLMProvider,
      inject: [ConfigService, LocalLLMProvider, BedrockProvider],
      useFactory: (
        config: ConfigService,
        local: LocalLLMProvider,
        bedrock: BedrockProvider,
      ): LLMProvider => {
        const provider = config.get<string>('AI_PROVIDER', 'local');
        if (provider === 'bedrock') {
          return bedrock;
        }
        return local;
      },
    },
  ],
  exports: [LLMProvider],
})
export class AIModule {}
