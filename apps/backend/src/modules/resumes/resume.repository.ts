import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { Prisma, ResumeStatus } from '@prisma/client';

/**
 * ResumeRepository — Data Access Layer
 *
 * All Prisma calls for the Resume domain live here.
 * The service layer NEVER touches Prisma directly.
 *
 * Clean Architecture benefit:
 *   If we switch from Prisma to Drizzle or raw SQL,
 *   only this file changes — services are unaffected.
 */
@Injectable()
export class ResumeRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: {
    userId: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    filePath: string;
    fileUrl?: string;
  }) {
    return this.prisma.resume.create({ data });
  }

  async findById(id: string, userId?: string) {
    return this.prisma.resume.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
    });
  }

  async findByUserId(
    userId: string,
    opts: {
      page: number;
      limit: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const { skip, take } = this.buildPaginationArgs(opts.page, opts.limit);

    const where: Prisma.ResumeWhereInput = {
      userId,
      ...(opts.search
        ? {
            OR: [
              { originalName: { contains: opts.search, mode: 'insensitive' } },
              { extractedText: { contains: opts.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ResumeOrderByWithRelationInput = {
      [(opts.sortBy ?? 'createdAt') as keyof Prisma.ResumeOrderByWithRelationInput]:
        opts.sortOrder ?? 'desc',
    };

    const [data, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          userId: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          fileUrl: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          // Don't select extractedText in list — too large
        },
      }),
      this.prisma.resume.count({ where }),
    ]);

    return { data, meta: this.buildPaginationMeta(total, opts.page, opts.limit) };
  }

  async updateStatus(
    id: string,
    status: ResumeStatus,
    extras?: {
      extractedText?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.prisma.resume.update({
      where: { id },
      data: {
        status,
        ...(extras?.extractedText !== undefined
          ? { extractedText: extras.extractedText }
          : {}),
        ...(extras?.metadata !== undefined ? { metadata: extras.metadata as object } : {}),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.resume.delete({ where: { id } });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.resume.count({ where: { userId } });
  }
}
