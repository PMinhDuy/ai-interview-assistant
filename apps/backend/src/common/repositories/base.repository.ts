import { PrismaService } from '../../infrastructure/database/prisma.service';

// ── Base repository with common query patterns ────────────────
// This is the Data Access Layer abstraction.
// All repositories extend this to get consistent error handling
// and query building.

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}

  protected buildPaginationArgs(page: number, limit: number) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return {
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    };
  }

  protected buildPaginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
