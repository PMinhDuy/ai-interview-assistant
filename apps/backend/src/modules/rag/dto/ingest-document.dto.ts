import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SourceTypeEnum {
  RESUME = 'RESUME',
  JOB_DESCRIPTION = 'JOB_DESCRIPTION',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export class IngestDocumentDto {
  @ApiProperty({ description: 'ID of the source document', example: 'd0e3a51f-6a68-450e-8fbf-5d820d82998a' })
  @IsUUID()
  @IsNotEmpty()
  sourceId!: string;

  @ApiProperty({ enum: SourceTypeEnum, example: SourceTypeEnum.RESUME })
  @IsEnum(SourceTypeEnum)
  @IsNotEmpty()
  sourceType!: SourceTypeEnum;

  @ApiProperty({ description: 'Text content to chunk and index', example: 'Senior Full Stack Engineer with 6 years experience...' })
  @IsString()
  @IsNotEmpty()
  text!: string;

  @ApiPropertyOptional({ description: 'Chunk size in characters', default: 512 })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(2048)
  chunkSize?: number;

  @ApiPropertyOptional({ description: 'Chunk overlap in characters', default: 64 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(512)
  chunkOverlap?: number;
}
