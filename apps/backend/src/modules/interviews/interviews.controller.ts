import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { InterviewsService } from './services/interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import {
  CreateInterviewSessionDto,
  GenerateQuestionsDto,
  InterviewSessionResponseDto,
  UpdateInterviewSessionStatusDto,
} from './dto/interview.dto';

@ApiTags('interviews')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'interviews', version: '1' })
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new interview session and generate initial questions' })
  @ApiResponse({ status: 201, type: InterviewSessionResponseDto })
  createSession(
    @GetUser('id') userId: string,
    @Body() dto: CreateInterviewSessionDto,
  ) {
    return this.interviewsService.createSession(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all interview sessions for the authenticated user' })
  @ApiResponse({ status: 200, type: [InterviewSessionResponseDto] })
  getSessions(@GetUser('id') userId: string) {
    return this.interviewsService.getSessions(userId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Get interview session details by ID, including questions' })
  @ApiResponse({ status: 200, type: InterviewSessionResponseDto })
  @ApiResponse({ status: 404, description: 'Interview session not found' })
  getSession(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.interviewsService.getSession(id, userId);
  }

  @Patch(':id/status')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Update interview session status (ACTIVE, PAUSED, COMPLETED, CANCELLED)' })
  @ApiResponse({ status: 200, description: 'Session status updated successfully' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateInterviewSessionStatusDto,
  ) {
    return this.interviewsService.updateStatus(id, userId, dto);
  }

  @Post(':id/questions/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Generate additional questions for an active interview session' })
  @ApiResponse({ status: 201, description: 'Questions generated successfully' })
  generateQuestions(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
    @Body() dto: GenerateQuestionsDto,
  ) {
    return this.interviewsService.generateMoreQuestions(id, userId, dto);
  }

  @Get(':id/questions/current')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Get the current active question for an interview session' })
  @ApiResponse({ status: 200, description: 'Returns current question object or completed status' })
  getCurrentQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.interviewsService.getCurrentQuestion(id, userId);
  }

  @Post(':id/questions/next')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Advance to the next question in the interview session' })
  @ApiResponse({ status: 200, description: 'Returns next question or completion indicator' })
  nextQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.interviewsService.nextQuestion(id, userId);
  }
}
