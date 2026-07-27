import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { RAGService } from './services/rag.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IngestDocumentDto, SourceTypeEnum } from './dto/ingest-document.dto';
import { QueryRAGDto } from './dto/query-rag.dto';

@ApiTags('rag')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'rag', version: '1' })
export class RAGController {
  constructor(private readonly ragService: RAGService) {}

  @Post('ingest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ingest and chunk a raw document into pgvector store' })
  @ApiResponse({ status: 200, description: 'Document ingested successfully' })
  ingestDocument(@Body() dto: IngestDocumentDto) {
    return this.ragService.ingestDocument(dto);
  }

  @Post('ingest/resume/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Ingest extracted text from an existing Resume' })
  ingestResume(@Param('id', ParseUUIDPipe) id: string) {
    return this.ragService.ingestResume(id);
  }

  @Post('ingest/job-description/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Ingest extracted text from an existing Job Description' })
  ingestJobDescription(@Param('id', ParseUUIDPipe) id: string) {
    return this.ragService.ingestJobDescription(id);
  }

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform similarity search against pgvector store' })
  @ApiResponse({ status: 200, description: 'Retrieved context chunks and similarity scores' })
  queryRAG(@Body() dto: QueryRAGDto) {
    return this.ragService.retrieveContext(dto);
  }

  @Delete('source/:sourceType/:sourceId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'sourceType', enum: SourceTypeEnum })
  @ApiParam({ name: 'sourceId', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Delete vector embeddings for a specific document source' })
  async deleteSource(
    @Param('sourceType') sourceType: SourceTypeEnum,
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
  ) {
    const deletedCount = await this.ragService.deleteEmbeddings(sourceType, sourceId);
    return { deletedCount };
  }
}
