import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, EmbeddingProvider } from '../providers/provider.interface';
import { LocalLLMProvider } from './providers/local-llm.provider';
import { BedrockProvider } from './providers/bedrock.provider';
import { LocalEmbeddingProvider } from './providers/local-embedding.provider';
import { TitanEmbeddingProvider } from './providers/titan-embedding.provider';

/**
 * AIModule — Provider Factory
 *
 * Exposes the active LLMProvider and EmbeddingProvider.
 * Toggled via AI_PROVIDER and EMBEDDING_PROVIDER environment variables.
 */
@Global()
@Module({
  providers: [
    LocalLLMProvider,
    BedrockProvider,
    LocalEmbeddingProvider,
    TitanEmbeddingProvider,
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
    {
      provide: EmbeddingProvider,
      inject: [ConfigService, LocalEmbeddingProvider, TitanEmbeddingProvider],
      useFactory: (
        config: ConfigService,
        local: LocalEmbeddingProvider,
        titan: TitanEmbeddingProvider,
      ): EmbeddingProvider => {
        const provider = config.get<string>('EMBEDDING_PROVIDER', 'local');
        if (provider === 'titan') {
          return titan;
        }
        return local;
      },
    },
  ],
  exports: [LLMProvider, EmbeddingProvider],
})
export class AIModule {}
