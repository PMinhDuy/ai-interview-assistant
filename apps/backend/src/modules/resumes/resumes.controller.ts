import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
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

import { ResumesService } from './resumes.service';
import type { ListResumesQueryDto} from './dto/resume.dto';
import { ResumeResponseDto } from './dto/resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { multerConfig, documentFileFilter } from '../../common/config/multer.config';

@ApiTags('resumes')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'resumes', version: '1' })
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { ...multerConfig, fileFilter: documentFileFilter }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Resume file (PDF, DOCX, DOC) — max 10MB',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Upload a resume',
    description: `Upload a PDF, DOCX, or DOC file. The file is validated by magic bytes,
    stored locally or in S3 (based on STORAGE_PROVIDER env), then text is extracted
    asynchronously. Poll the GET endpoint to check when status changes to ANALYZED.`,
  })
  @ApiResponse({ status: 201, description: 'Resume uploaded, processing started', type: ResumeResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid file type, size, or user resume limit reached' })
  async upload(
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Send a multipart/form-data request with field "file".');
    }
    return this.resumesService.upload(userId, file);
  }

  @Get()
  @ApiOperation({
    summary: 'List resumes',
    description: 'Returns paginated list of resumes for the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Paginated resume list' })
  findAll(@GetUser('id') userId: string, @Query() query: ListResumesQueryDto) {
    return this.resumesService.findAll(userId, query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Get resume by ID' })
  @ApiResponse({ status: 200, description: 'Resume details including extracted text if available', type: ResumeResponseDto })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.resumesService.findOne(id, userId);
  }

  @Get(':id/text')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({
    summary: 'Get extracted text',
    description: 'Returns the extracted plain text from the resume. Only available after status=ANALYZED.',
  })
  @ApiResponse({ status: 200, description: 'Extracted text and word count' })
  @ApiResponse({ status: 400, description: 'Resume still processing or extraction failed' })
  getExtractedText(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ) {
    return this.resumesService.getExtractedText(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Delete a resume and its stored file' })
  @ApiResponse({ status: 204, description: 'Resume deleted' })
  @ApiResponse({ status: 404, description: 'Resume not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    await this.resumesService.remove(id, userId);
  }
}
