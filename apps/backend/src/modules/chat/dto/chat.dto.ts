import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'uuid-session-123' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ example: 'My Tech Chat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: 'llama3' })
  @IsOptional()
  @IsString()
  model?: string;
}

export class SendMessageDto {
  @ApiProperty({ example: 'Explain the difference between interface and abstract class in TypeScript.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'uuid-conversation-123' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({ example: 'uuid-session-123' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class MessageResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() conversationId: string;
  @ApiProperty({ enum: ['user', 'assistant', 'system'] }) role: 'user' | 'assistant' | 'system';
  @ApiProperty() content: string;
  @ApiPropertyOptional() tokenCount?: number;
  @ApiPropertyOptional() latencyMs?: number;
  @ApiPropertyOptional() model?: string;
  @ApiProperty() createdAt: string;
}

export class ConversationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() sessionId?: string;
  @ApiPropertyOptional() title?: string;
  @ApiProperty() model: string;
  @ApiProperty() provider: string;
  @ApiProperty() totalTokens: number;
  @ApiProperty({ type: [MessageResponseDto] }) messages?: MessageResponseDto[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
