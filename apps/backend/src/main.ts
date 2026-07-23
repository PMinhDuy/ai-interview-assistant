import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // ── Security ─────────────────────────────────────────────
  app.use(helmet());

  const corsOrigins = config.get<string>('CORS_ORIGINS', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    credentials: true,
  });

  // ── API Versioning ────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global Prefix ─────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation ────────────────────────────────────────────
  // whitelist: strip unknown properties (security)
  // forbidNonWhitelisted: throw error on unknown properties
  // transform: auto-transform payloads to DTO class instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Filters ────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // ── Global Interceptors ───────────────────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new TransformInterceptor(),
  );

  // ── Swagger / OpenAPI ─────────────────────────────────────
  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AI Interview Assistant API')
      .setDescription(
        `
## Overview
Production-ready AI Interview Assistant backend API.

## Authentication
Uses JWT Bearer tokens. Get a token via POST /api/v1/auth/login.

## AI Providers
- **Local (default):** Ollama running on localhost:11434
- **AWS Bedrock (optional):** Set AI_PROVIDER=bedrock in env

## Rate Limiting
- Default: 100 requests / 60 seconds per IP
- Auth endpoints: 5 requests / 60 seconds
      `,
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'JWT',
      )
      .addTag('auth', 'Authentication & authorization')
      .addTag('users', 'User profile management')
      .addTag('resumes', 'Resume upload & analysis')
      .addTag('job-descriptions', 'Job description management')
      .addTag('interviews', 'Interview session management')
      .addTag('evaluations', 'Answer evaluation & feedback')
      .addTag('chat', 'AI chat & streaming')
      .addTag('prompts', 'Prompt management & versioning')
      .addTag('rag', 'Custom RAG knowledge base')
      .addTag('health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
      },
    });

    logger.log('Swagger UI available at: /api/docs', 'Bootstrap');
  }

  const port = config.get<number>('APP_PORT', 3001);
  await app.listen(port);

  logger.log(
    `🚀 Server running on http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(
    `📡 AI Provider: ${config.get('AI_PROVIDER', 'local')}`,
    'Bootstrap',
  );
  logger.log(
    `🗄️  Storage: ${config.get('STORAGE_PROVIDER', 'local')}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
