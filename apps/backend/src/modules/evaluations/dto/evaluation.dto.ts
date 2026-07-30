import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class EvaluationScoreDto {
  @ApiProperty({ example: 85, description: 'Weighted overall score (0-100)' })
  overall: number;

  @ApiProperty({ example: 90, description: 'Technical accuracy score (0-100)' })
  technical: number;

  @ApiProperty({ example: 80, description: 'Communication clarity score (0-100)' })
  communication: number;

  @ApiProperty({ example: 85, description: 'Problem solving & reasoning score (0-100)' })
  problemSolving: number;

  @ApiProperty({ example: 80, description: 'Depth of knowledge & trade-offs score (0-100)' })
  depth: number;
}

export class EvaluateAnswerDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5', description: 'Question ID to evaluate' })
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', description: 'Session ID' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiPropertyOptional({ example: 'NestJS relies on metadata reflection for dependency injection...', description: 'Optional user answer override' })
  @IsOptional()
  @IsString()
  userAnswer?: string;
}

export class EvaluationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() sessionId: string;
  @ApiProperty() questionId: string;
  @ApiProperty() userAnswer: string;
  @ApiProperty({ type: EvaluationScoreDto }) scores: EvaluationScoreDto;
  @ApiProperty() feedback: string;
  @ApiProperty({ type: [String] }) strengths: string[];
  @ApiProperty({ type: [String] }) improvements: string[];
  @ApiPropertyOptional() suggestedAnswer?: string;
  @ApiPropertyOptional() complexityAnalysis?: object;
  @ApiProperty() createdAt: Date;
}
