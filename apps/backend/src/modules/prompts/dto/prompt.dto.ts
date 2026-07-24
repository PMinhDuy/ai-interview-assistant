import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, MaxLength } from 'class-validator';

export class CreatePromptDto {
  @ApiProperty({ example: 'resume-analysis' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Analyzes resume content for ATS score and strengths.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'Analyze this resume: {{resume_text}} against {{job_description}}.' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty({ example: ['resume_text', 'job_description'] })
  @IsArray()
  @IsString({ each: true })
  variables: string[];
}

export class UpdatePromptDto {
  @ApiPropertyOptional({ example: 'Updated template content: {{resume_text}}.' })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({ example: 'Updated description details.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: ['resume_text'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}

export class CompilePromptDto {
  @ApiProperty({ example: { resume_text: 'John Doe resume...', job_description: 'Software Engineer' } })
  @IsNotEmpty()
  variables: Record<string, string>;
}

export class PromptResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() version: number;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() template: string;
  @ApiProperty({ type: [String] }) variables: string[];
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
