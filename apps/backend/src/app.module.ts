import { resolve } from 'path';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/cache/redis.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { FileModule } from './infrastructure/file/file.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { JobDescriptionsModule } from './modules/job-descriptions/job-descriptions.module';
import { FilesModule } from './modules/files/files.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────
    // ConfigModule is global — available everywhere without importing
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(__dirname, '../../../../.env.local'),
        resolve(__dirname, '../../../../.env'),
      ],
      validate, // Joi/Zod validation of env vars at startup
    }),

    // ── Rate Limiting ─────────────────────────────────────
    // Applied globally via ThrottlerGuard in providers
    // AIP-C01 note: Rate limiting is a key security control
    // for LLM APIs to prevent token abuse
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000, // ms
          limit: config.get<number>('RATE_LIMIT_MAX', 100),
        },
        {
          name: 'auth',
          ttl: 60 * 1000,
          limit: 5, // strict limit for auth endpoints
        },
      ],
    }),

    // ── Infrastructure ────────────────────────────────────
    LoggerModule,
    PrismaModule,
    RedisModule,
    StorageModule,
    FileModule,

    // ── Feature Modules ───────────────────────────────────
    HealthModule,
    AuthModule,
    UsersModule,
    ResumesModule,
    JobDescriptionsModule,
    FilesModule,
    // Future modules added here per phase:
    // ChatModule       — Phase 3
    // PromptsModule    — Phase 4
    // RagModule        — Phase 5
    // InterviewsModule — Phase 6
    // EvaluationsModule — Phase 7
  ],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Attach correlation ID to every request for distributed tracing
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
