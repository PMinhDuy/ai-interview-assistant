import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import serverlessExpress from '@vendia/serverless-express';
import { type Handler, type Context, type Callback } from 'aws-lambda';

import { AppModule } from './app.module';
import { LoggerService } from './infrastructure/logger/logger.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

let cachedServer: Handler;

async function bootstrapServer(): Promise<Handler> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(ConfigService);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // ── Security ─────────────────────────────────────────────
  app.use(helmet());

  const corsOrigins = config.get<string>('CORS_ORIGINS', 'https://ai-interview-assistant.pages.dev');
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Filters & Interceptors ─────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter(logger));
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new TransformInterceptor(),
  );

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

// Lambda handler — reuses cached server across warm invocations
export const handler: Handler = async (
  event: Parameters<Handler>[0],
  context: Context,
  callback: Callback,
) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    if (!cachedServer) {
      cachedServer = await bootstrapServer();
    }
    return await cachedServer(event, context, callback);
  } catch (err) {
    console.error('💥 Fatal error during Lambda initialization/execution:', err);
    throw err;
  }
};
