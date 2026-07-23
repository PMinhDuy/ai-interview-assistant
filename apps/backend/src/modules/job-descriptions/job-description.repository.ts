import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import type { Prisma, ExperienceLevel } from '@prisma/client';

@Injectable()
export class JobDescriptionRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(data: {
    userId: string;
    title: string;
    company?: string;
    filename?: string;
    extractedText: string;
    requirements?: string[];
    niceToHave?: string[];
    techStack?: string[];
    experienceLevel?: ExperienceLevel;
  }) {
    return this.prisma.jobDescription.create({ data });
  }

  async findById(id: string, userId?: string) {
    return this.prisma.jobDescription.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
    });
  }

  async findByUserId(
    userId: string,
    opts: { page: number; limit: number; search?: string },
  ) {
    const { skip, take } = this.buildPaginationArgs(opts.page, opts.limit);

    const where: Prisma.JobDescriptionWhereInput = {
      userId,
      ...(opts.search
        ? {
            OR: [
              { title: { contains: opts.search, mode: 'insensitive' } },
              { company: { contains: opts.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.jobDescription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.jobDescription.count({ where }),
    ]);

    return { data, meta: this.buildPaginationMeta(total, opts.page, opts.limit) };
  }

  async update(
    id: string,
    data: Partial<{
      requirements: string[];
      niceToHave: string[];
      techStack: string[];
      experienceLevel: ExperienceLevel;
    }>,
  ) {
    return this.prisma.jobDescription.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.jobDescription.delete({ where: { id } });
  }
}
