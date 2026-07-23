import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ResumeSortBy {
  CREATED_AT = 'createdAt',
  STATUS = 'status',
  SIZE = 'size',
}

export class ListResumesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  limit: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ResumeSortBy, default: ResumeSortBy.CREATED_AT })
  @IsOptional()
  @IsEnum(ResumeSortBy)
  sortBy: ResumeSortBy = ResumeSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}

export class ResumeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() filename: string;
  @ApiProperty() originalName: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() size: number;
  @ApiProperty({ nullable: true }) fileUrl: string | null;
  @ApiProperty({ enum: ['PENDING', 'PROCESSING', 'ANALYZED', 'FAILED'] })
  status: string;
  @ApiPropertyOptional() extractedText?: string;
  @ApiPropertyOptional() metadata?: Record<string, unknown>;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
