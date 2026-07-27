import { Injectable, NotImplementedException } from '@nestjs/common';
import { EmbeddingProvider } from '../../providers/provider.interface';
import type { EmbeddingRequest, EmbeddingResponse } from '@repo/types';

/**
 * TitanEmbeddingProvider (AWS Bedrock Titan Embeddings V2 stub)
 *
 * Implemented in Phase 9 for AWS Bedrock integration.
 * Serves as a swappable provider abstraction for Clean Architecture.
 */
@Injectable()
export class TitanEmbeddingProvider extends EmbeddingProvider {
  embed(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new NotImplementedException('TitanEmbeddingProvider is implemented in Phase 9. Set EMBEDDING_PROVIDER=local.');
  }

  embedBatch(_texts: string[]): Promise<EmbeddingResponse[]> {
    throw new NotImplementedException('TitanEmbeddingProvider is implemented in Phase 9. Set EMBEDDING_PROVIDER=local.');
  }

  getDimensions(): number {
    return 1024;
  }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
