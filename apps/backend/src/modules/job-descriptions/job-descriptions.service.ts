import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JobDescriptionRepository } from './job-description.repository';
import { FileProcessorService } from '../../infrastructure/file/file-processor.service';
import { StorageProvider } from '../../infrastructure/providers/provider.interface';
import { LocalStorageProvider } from '../../infrastructure/storage/local-storage.provider';
import type { CreateJobDescriptionDto, ListJobDescriptionsQueryDto } from './dto/job-description.dto';
import { ExperienceLevel } from '@prisma/client';

/**
 * JobDescriptionsService
 *
 * Supports two input modes:
 *   1. File upload (PDF/DOCX) — extract text automatically
 *   2. Plain text — paste the JD directly (common use case)
 *
 * After extraction, the raw text is stored for:
 *   - RAG embedding (Phase 5)
 *   - Resume-JD matching (Phase 6)
 *   - Interview question context
 */
@Injectable()
export class JobDescriptionsService {
  private readonly logger = new Logger(JobDescriptionsService.name);

  constructor(
    private readonly jdRepo: JobDescriptionRepository,
    private readonly fileProcessor: FileProcessorService,
    private readonly storageProvider: StorageProvider,
  ) {}

  async createFromFile(
    userId: string,
    file: Express.Multer.File,
    dto: CreateJobDescriptionDto,
  ) {
    // Validate file
    const validated = await this.fileProcessor.validateFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Store file
    const storageKey = LocalStorageProvider.buildKey('job-descriptions', userId, validated.originalName);
    await this.storageProvider.upload(storageKey, validated.buffer, validated.mimeType);

    // Extract text synchronously (JDs are usually small, < 2 pages)
    const extracted = await this.fileProcessor.extractText(validated.buffer, validated.mimeType);

    const jd = await this.jdRepo.create({
      userId,
      title: dto.title,
      company: dto.company,
      filename: storageKey,
      extractedText: extracted.text,
      experienceLevel: dto.experienceLevel ?? ExperienceLevel.MID,
    });

    this.logger.log(`JD created from file: ${jd.id}`);
    return jd;
  }

  async createFromText(
    userId: string,
    dto: CreateJobDescriptionDto & { rawText: string },
  ) {
    if (!dto.rawText || dto.rawText.trim().length < 50) {
      throw new BadRequestException('Job description text must be at least 50 characters');
    }

    const jd = await this.jdRepo.create({
      userId,
      title: dto.title,
      company: dto.company,
      extractedText: dto.rawText.trim(),
      experienceLevel: dto.experienceLevel ?? ExperienceLevel.MID,
    });

    this.logger.log(`JD created from text: ${jd.id}`);
    return jd;
  }

  async findAll(userId: string, query: ListJobDescriptionsQueryDto) {
    return this.jdRepo.findByUserId(userId, {
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  async findOne(id: string, userId: string) {
    const jd = await this.jdRepo.findById(id);
    if (!jd) throw new NotFoundException('Job description not found');
    if (jd.userId !== userId) throw new ForbiddenException('Access denied');
    return jd;
  }

  async remove(id: string, userId: string): Promise<void> {
    const jd = await this.findOne(id, userId);

    if (jd.filename) {
      await this.storageProvider.delete(jd.filename).catch((err: Error) => {
        this.logger.warn(`Failed to delete JD file: ${jd.filename}`, err.message);
      });
    }

    await this.jdRepo.delete(id);
    this.logger.log(`JD deleted: ${id} by user ${userId}`);
  }
}
