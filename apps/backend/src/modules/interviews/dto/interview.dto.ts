import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Difficulty, InterviewStatus, InterviewType, QuestionCategory } from '@prisma/client';

export class CreateInterviewSessionDto {
  @ApiProperty({
    enum: InterviewType,
    example: InterviewType.TECHNICAL,
    description: 'Type of interview session',
  })
  @IsEnum(InterviewType)
  @IsNotEmpty()
  type: InterviewType;

  @ApiProperty({
    enum: Difficulty,
    example: Difficulty.MEDIUM,
    description: 'Difficulty level of the interview',
  })
  @IsEnum(Difficulty)
  @IsNotEmpty()
  difficulty: Difficulty;

  @ApiPropertyOptional({
    example: 'd9bcbd37-f5e7-449e-a53d-c1b73c6934ae',
    description: 'Associated Resume ID for context',
  })
  @IsOptional()
  @IsUUID()
  resumeId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
    description: 'Associated Job Description ID for context',
  })
  @IsOptional()
  @IsUUID()
  jobDescriptionId?: string;

  @ApiPropertyOptional({
    example: 10,
    default: 10,
    description: 'Total number of questions targeted for this session',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(30)
  totalQuestions?: number;

  @ApiPropertyOptional({
    example: 'llama3',
    description: 'LLM model to use for generating questions and evaluating',
  })
  @IsOptional()
  @IsString()
  model?: string;
}

export class UpdateInterviewSessionStatusDto {
  @ApiProperty({
    enum: InterviewStatus,
    example: InterviewStatus.ACTIVE,
    description: 'New status for the interview session',
  })
  @IsEnum(InterviewStatus)
  @IsNotEmpty()
  status: InterviewStatus;
}

export class GenerateQuestionsDto {
  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Number of questions to generate',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  count?: number;

  @ApiPropertyOptional({
    enum: QuestionCategory,
    example: QuestionCategory.NESTJS,
    description: 'Target category to override',
  })
  @IsOptional()
  @IsEnum(QuestionCategory)
  category?: QuestionCategory;
}

export class SubmitAnswerDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5',
    description: 'Question ID being answered',
  })
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    example: 'NestJS uses dependency injection via metadata reflection...',
    description: 'Candidate answer',
  })
  @IsString()
  @IsNotEmpty()
  userAnswer: string;
}

export class InterviewSessionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() resumeId?: string;
  @ApiPropertyOptional() jobDescriptionId?: string;
  @ApiProperty({ enum: InterviewType }) type: InterviewType;
  @ApiProperty({ enum: Difficulty }) difficulty: Difficulty;
  @ApiProperty({ enum: InterviewStatus }) status: InterviewStatus;
  @ApiProperty() totalQuestions: number;
  @ApiProperty() currentQuestionIndex: number;
  @ApiProperty() model: string;
  @ApiProperty() provider: string;
  @ApiPropertyOptional() startedAt?: Date;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
