import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { EvaluationsService } from './services/evaluations.service';

@ApiTags('evaluations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get all evaluations for an interview session' })
  @ApiResponse({ status: 200, description: 'Evaluations retrieved successfully' })
  async getSessionEvaluations(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.evaluationsService.getEvaluationsBySession(sessionId);
  }

  @Get('sessions/:sessionId/report')
  @ApiOperation({ summary: 'Get summary report for an interview session' })
  @ApiResponse({ status: 200, description: 'Session report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Session report not found' })
  async getSessionReport(
    @GetUser() user: User,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    try {
      return await this.evaluationsService.getSessionReport(sessionId);
    } catch {
      // If not yet generated, try generating on demand
      return await this.evaluationsService.generateSessionReport(sessionId, user.id);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific evaluation' })
  @ApiResponse({ status: 200, description: 'Evaluation details retrieved' })
  @ApiResponse({ status: 404, description: 'Evaluation not found' })
  async getEvaluationById(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.evaluationsService.getEvaluationById(id);
  }
}
