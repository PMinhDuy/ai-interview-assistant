import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, EmbeddingProvider } from '../providers/provider.interface';
import { BedrockProvider } from './providers/bedrock.provider';
import { GeminiLLMProvider } from './providers/gemini-llm.provider';
import { TitanEmbeddingProvider } from './providers/titan-embedding.provider';
import { GeminiEmbeddingProvider } from './providers/gemini-embedding.provider';

/**
 * AIModule — Provider Factory
 *
 * Exposes the active LLMProvider and EmbeddingProvider.
 * Toggled via AI_PROVIDER and EMBEDDING_PROVIDER environment variables.
 */
@Global()
@Module({
  providers: [
    BedrockProvider,
    GeminiLLMProvider,
    TitanEmbeddingProvider,
    GeminiEmbeddingProvider,
    {
      provide: LLMProvider,
      inject: [ConfigService, BedrockProvider, GeminiLLMProvider],
      useFactory: (
        config: ConfigService,
        bedrock: BedrockProvider,
        gemini: GeminiLLMProvider,
      ): LLMProvider => {
        const provider = config.get<string>('AI_PROVIDER', 'gemini');
        switch (provider.toLowerCase()) {
          case 'bedrock':
            return bedrock;
          case 'gemini':
          case 'google':
          default:
            return gemini;
        }
      },
    },
    {
      provide: EmbeddingProvider,
      inject: [ConfigService, TitanEmbeddingProvider, GeminiEmbeddingProvider],
      useFactory: (
        config: ConfigService,
        titan: TitanEmbeddingProvider,
        gemini: GeminiEmbeddingProvider,
      ): EmbeddingProvider => {
        const provider = config.get<string>('EMBEDDING_PROVIDER', 'gemini');
        switch (provider.toLowerCase()) {
          case 'titan':
            return titan;
          case 'gemini':
          case 'google':
          default:
            return gemini;
        }
      },
    },
  ],
  exports: [
    LLMProvider,
    EmbeddingProvider,
    BedrockProvider,
    GeminiLLMProvider,
    TitanEmbeddingProvider,
    GeminiEmbeddingProvider,
  ],
})
export class AIModule {}
