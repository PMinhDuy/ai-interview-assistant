import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

import type { JobDescriptionsService } from './job-descriptions.service';
import type {
  ListJobDescriptionsQueryDto} from './dto/job-description.dto';
import {
  CreateJobDescriptionDto,
  JobDescriptionResponseDto,
} from './dto/job-description.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { multerConfig, documentFileFilter } from '../../common/config/multer.config';

class CreateFromTextDto extends CreateJobDescriptionDto {
  @IsString()
  @MinLength(50)
  rawText: string;
}

@ApiTags('job-descriptions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'job-descriptions', version: '1' })
export class JobDescriptionsController {
  constructor(private readonly jdService: JobDescriptionsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { ...multerConfig, fileFilter: documentFileFilter }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title'],
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string', example: 'Senior React Developer' },
        company: { type: 'string', example: 'Acme Corp' },
        experienceLevel: {
          type: 'string',
          enum: ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'STAFF'],
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a job description PDF or DOCX' })
  @ApiResponse({ status: 201, description: 'JD created', type: JobDescriptionResponseDto })
  async uploadFile(
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateJobDescriptionDto,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.jdService.createFromFile(userId, file, dto);
  }

  @Post('text')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create JD from pasted text',
    description: 'Paste the job description text directly — no file needed.',
  })
  @ApiResponse({ status: 201, description: 'JD created', type: JobDescriptionResponseDto })
  createFromText(
    @GetUser('id') userId: string,
    @Body() dto: CreateFromTextDto,
  ) {
    return this.jdService.createFromText(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List job descriptions' })
  findAll(@GetUser('id') userId: string, @Query() query: ListJobDescriptionsQueryDto) {
    return this.jdService.findAll(userId, query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Get job description by ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.jdService.findOne(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Delete a job description' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    await this.jdService.remove(id, userId);
  }
}
