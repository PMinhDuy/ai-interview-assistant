import { Module } from '@nestjs/common';
import { TextChunkingService } from './services/text-chunking.service';
import { VectorStoreRepository } from './repositories/vector-store.repository';
import { RAGService } from './services/rag.service';
import { RAGController } from './rag.controller';

@Module({
  providers: [TextChunkingService, VectorStoreRepository, RAGService],
  controllers: [RAGController],
  exports: [RAGService, VectorStoreRepository, TextChunkingService],
})
export class RAGModule {}
