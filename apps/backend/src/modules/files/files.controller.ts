import { Controller, Get, Param, Res, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * FilesController
 *
 * Serves uploaded files for the LocalStorageProvider.
 * In production (S3), files would be served directly from S3/CloudFront
 * and this controller would be unused.
 *
 * Security: Files are protected by JWT — only authenticated users
 * can access files. In a production system, you'd also check
 * that the requesting user owns the file.
 *
 * This controller is skipped when STORAGE_PROVIDER=s3.
 */
@ApiTags('files')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'files', version: '1' })
export class FilesController {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = config.get<string>('UPLOAD_DIR', './uploads');
  }

  @Get('*path')
  @ApiOperation({ summary: 'Serve a stored file (local storage mode)' })
  async serveFile(@Param('path') filePath: string, @Res() res: Response) {
    const fullPath = path.join(this.uploadDir, filePath);

    // Prevent path traversal: ensure resolved path starts with upload dir
    const resolvedUploadDir = path.resolve(this.uploadDir);
    const resolvedFilePath = path.resolve(fullPath);

    if (!resolvedFilePath.startsWith(resolvedUploadDir)) {
      throw new NotFoundException('File not found');
    }

    if (!fs.existsSync(resolvedFilePath)) {
      throw new NotFoundException('File not found');
    }

    res.sendFile(resolvedFilePath);
  }
}
