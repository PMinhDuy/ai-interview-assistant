import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ResumeRepository } from './resume.repository';
import { FileProcessorService } from '../../infrastructure/file/file-processor.service';
import { StorageProvider } from '../../infrastructure/providers/provider.interface';
import { LocalStorageProvider } from '../../infrastructure/storage/local-storage.provider';
import type { ListResumesQueryDto } from './dto/resume.dto';

/**
 * ResumesService — Business Logic Layer
 *
 * Orchestrates:
 *   1. File validation (via FileProcessorService)
 *   2. Storage (via StorageProvider — local or S3)
 *   3. Text extraction (async after initial response)
 *   4. DB persistence (via ResumeRepository)
 *
 * Why async text extraction?
 *   PDF parsing can take 2-5 seconds for large files.
 *   We save the file first, respond with 201, then process in background.
 *   This keeps API response time < 500ms.
 *
 * AIP-C01 Pattern:
 *   This mirrors AWS Step Functions or Lambda async patterns:
 *   Upload → Trigger → Process → Update
 *   Here we use setImmediate() for simplicity. Phase 6 will use Bull queues.
 */
@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);
  private static readonly MAX_RESUMES_PER_USER = 20;

  constructor(
    private readonly resumeRepo: ResumeRepository,
    private readonly fileProcessor: FileProcessorService,
    private readonly storageProvider: StorageProvider,
  ) {}

  async upload(
    userId: string,
    file: Express.Multer.File,
  ) {
    // Guard: limit resumes per user
    const count = await this.resumeRepo.countByUser(userId);
    if (count >= ResumesService.MAX_RESUMES_PER_USER) {
      throw new BadRequestException(
        `Maximum ${ResumesService.MAX_RESUMES_PER_USER} resumes allowed per user`,
      );
    }

    // Step 1: Validate file (magic bytes, size, type)
    const validated = await this.fileProcessor.validateFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Step 2: Build storage key and upload
    const storageKey = LocalStorageProvider.buildKey('resumes', userId, validated.originalName);
    await this.storageProvider.upload(storageKey, validated.buffer, validated.mimeType);
    const fileUrl = this.storageProvider.getUrl(storageKey);

    // Step 3: Persist to DB with PENDING status
    const resume = await this.resumeRepo.create({
      userId,
      filename: storageKey,
      originalName: validated.originalName,
      mimeType: validated.mimeType,
      size: validated.size,
      filePath: storageKey,
      fileUrl,
    });

    this.logger.log(`Resume uploaded: ${resume.id} by user ${userId}`);

    // Step 4: Trigger async text extraction (non-blocking)
    // In production, this would be a Bull queue job
    setImmediate(() => {
      this.processResumeAsync(resume.id, validated.buffer, validated.mimeType).catch(
        (err: Error) =>
          this.logger.error(`Async processing failed for resume ${resume.id}`, err.stack),
      );
    });

    return resume;
  }

  async findAll(userId: string, query: ListResumesQueryDto) {
    return this.resumeRepo.findByUserId(userId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async findOne(id: string, userId: string) {
    const resume = await this.resumeRepo.findById(id);
    if (!resume) throw new NotFoundException('Resume not found');
    if (resume.userId !== userId) throw new ForbiddenException('Access denied');
    return resume;
  }

  async remove(id: string, userId: string): Promise<void> {
    const resume = await this.findOne(id, userId); // validates ownership

    // Delete from storage (fire-and-forget — don't fail DB delete if storage fails)
    await this.storageProvider.delete(resume.filePath).catch((err: Error) => {
      this.logger.warn(`Failed to delete file from storage: ${resume.filePath}`, err.message);
    });

    await this.resumeRepo.delete(id);
    this.logger.log(`Resume deleted: ${id} by user ${userId}`);
  }

  async getExtractedText(id: string, userId: string): Promise<{ text: string; wordCount: number }> {
    const resume = await this.findOne(id, userId);

    if (resume.status === 'PENDING' || resume.status === 'PROCESSING') {
      throw new BadRequestException('Resume is still being processed. Please try again shortly.');
    }

    if (resume.status === 'FAILED') {
      throw new BadRequestException('Text extraction failed for this resume.');
    }

    if (!resume.extractedText) {
      throw new BadRequestException('No extracted text available for this resume.');
    }

    return {
      text: resume.extractedText,
      wordCount: resume.extractedText.split(/\s+/).filter(Boolean).length,
    };
  }

  // ── Private: Async Processing ─────────────────────────────────

  private async processResumeAsync(
    resumeId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    // Mark as processing
    await this.resumeRepo.updateStatus(resumeId, 'PROCESSING');

    try {
      const startMs = Date.now();

      // Extract text from document
      const extracted = await this.fileProcessor.extractText(buffer, mimeType);

      // Build basic metadata from extracted text
      const metadata = {
        wordCount: extracted.wordCount,
        characterCount: extracted.characterCount,
        pageCount: extracted.pageCount,
        extractedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startMs,
      };

      await this.resumeRepo.updateStatus(resumeId, 'ANALYZED', {
        extractedText: extracted.text,
        metadata,
      });

      this.logger.log(
        `Resume processed: ${resumeId} — ${extracted.wordCount} words in ${Date.now() - startMs}ms`,
      );
    } catch (err: unknown) {
      this.logger.error(`Resume processing failed: ${resumeId}`, (err as Error).stack);
      await this.resumeRepo.updateStatus(resumeId, 'FAILED');
    }
  }
}
