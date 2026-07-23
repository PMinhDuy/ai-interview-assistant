import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';

import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  SendMessageDto,
  CreateConversationDto,
  ConversationResponseDto,
  MessageResponseDto,
} from './dto/chat.dto';

@ApiTags('chat')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'chat', version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversation')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chat conversation' })
  @ApiResponse({ status: 201, type: ConversationResponseDto })
  createConversation(
    @GetUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(userId, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations of current user' })
  @ApiResponse({ status: 200, type: [ConversationResponseDto] })
  getConversations(@GetUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversation/:id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Get a conversation by ID, including messages' })
  @ApiResponse({ status: 200, type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  getConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.chatService.getConversation(id, userId);
  }

  @Delete('conversation/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 204, description: 'Conversation deleted' })
  async deleteConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    await this.chatService.deleteConversation(id, userId);
  }

  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message (blocking/non-streaming)',
    description: 'Send a message to the assistant and wait for the full response.',
  })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  sendMessage(
    @GetUser('id') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, dto);
  }

  @Post('stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a message (SSE streaming)',
    description: `Send a message and stream back Server-Sent Events (SSE).
    Content-Type returned will be text/event-stream.
    Events yielded:
      - 'meta': contains conversationId
      - 'message': yields text chunks
      - 'done': yields latency and token counts
      - 'error': yields error details`,
  })
  async sendMessageStream(
    @GetUser('id') userId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.chatService.sendMessageStream(userId, dto)) {
        res.write(`event: ${chunk.event}\ndata: ${chunk.data}\n\n`);
      }
    } catch (error) {
      res.write(`event: error\ndata: ${(error as Error).message}\n\n`);
    } finally {
      res.end();
    }
  }
}
// Helper decorator import for Swagger params
import { ApiParam } from '@nestjs/swagger';
