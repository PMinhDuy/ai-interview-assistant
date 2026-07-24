import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class PromptsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findActiveByName(name: string) {
    return this.prisma.prompt.findFirst({
      where: { name, isActive: true },
    });
  }

  async findByNameAndVersion(name: string, version: number) {
    return this.prisma.prompt.findUnique({
      where: {
        name_version: { name, version },
      },
    });
  }

  async findHighestVersion(name: string): Promise<number> {
    const agg = await this.prisma.prompt.aggregate({
      where: { name },
      _max: { version: true },
    });
    return agg._max.version ?? 0;
  }

  async createPrompt(data: {
    name: string;
    version: number;
    description?: string;
    template: string;
    variables: string[];
    isActive?: boolean;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // If we are making this version active, deactivate all other versions first
      if (data.isActive !== false) {
        await tx.prompt.updateMany({
          where: { name: data.name, isActive: true },
          data: { isActive: false },
        });
      }

      return tx.prompt.create({
        data: {
          name: data.name,
          version: data.version,
          description: data.description || null,
          template: data.template,
          variables: data.variables,
          isActive: data.isActive !== false, // Default to true if not specified
        },
      });
    });
  }

  async setVersionActive(name: string, version: number) {
    return this.prisma.$transaction(async (tx) => {
      // Deactivate all
      await tx.prompt.updateMany({
        where: { name, isActive: true },
        data: { isActive: false },
      });

      // Activate target
      return tx.prompt.update({
        where: {
          name_version: { name, version },
        },
        data: { isActive: true },
      });
    });
  }

  async findAllVersions(name: string) {
    return this.prisma.prompt.findMany({
      where: { name },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Returns latest version of all unique prompt templates
   */
  async findAllLatest() {
    // Select all prompts ordered by version desc, then group or filter in memory
    // (Prisma does not support distinct on multiple columns easily without raw query)
    const all = await this.prisma.prompt.findMany({
      orderBy: [
        { name: 'asc' },
        { version: 'desc' },
      ],
    });

    const latestMap = new Map<string, typeof all[0]>();
    for (const p of all) {
      if (!latestMap.has(p.name)) {
        latestMap.set(p.name, p);
      }
    }
    return Array.from(latestMap.values());
  }

  async deleteVersion(name: string, version: number) {
    return this.prisma.prompt.delete({
      where: {
        name_version: { name, version },
      },
    });
  }
}
