import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ExperienceLevel } from '@prisma/client';

export class CreateJobDescriptionDto {
  @ApiProperty({ example: 'Senior React Developer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({ example: 'SENIOR', enum: ExperienceLevel })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;
}

export class ListJobDescriptionsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  page: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
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
}

export class JobDescriptionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() company?: string;
  @ApiProperty() extractedText: string;
  @ApiProperty({ type: [String] }) requirements: string[];
  @ApiProperty({ type: [String] }) niceToHave: string[];
  @ApiProperty({ type: [String] }) techStack: string[];
  @ApiProperty({ enum: ExperienceLevel }) experienceLevel: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
