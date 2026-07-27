import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SourceTypeEnum } from './ingest-document.dto';

export class QueryRAGDto {
  @ApiProperty({ description: 'Search query to generate embedding and match against pgvector index', example: 'React state management and hooks experience' })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({ description: 'Number of top similar chunks to return', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  topK?: number;

  @ApiPropertyOptional({ description: 'Minimum cosine similarity score threshold (0.0 to 1.0)', default: 0.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  threshold?: number;

  @ApiPropertyOptional({ enum: SourceTypeEnum })
  @IsOptional()
  @IsEnum(SourceTypeEnum)
  sourceType?: SourceTypeEnum;
}
