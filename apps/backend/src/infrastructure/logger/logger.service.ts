import type { LoggerService as NestLoggerService } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';

/**
 * Structured, CloudWatch-compatible logger.
 *
 * AIP-C01 Note:
 *   CloudWatch Logs Insights can parse JSON logs directly.
 *   Always log as JSON in production. Never use console.log.
 *
 * Features:
 *   - Correlation ID per request (for distributed tracing)
 *   - Structured JSON output (CloudWatch / Datadog compatible)
 *   - Token/latency tracking for AI cost observability
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor(private readonly configService: ConfigService) {
    const logLevel = configService.get('LOG_LEVEL', 'info');
    const isDev = configService.get('NODE_ENV') === 'development';

    this.logger = createLogger({
      level: logLevel,
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        isDev
          ? format.combine(format.colorize(), format.simple())
          : format.json(),
      ),
      transports: [new transports.Console()],
    });
  }

  private buildMeta(context?: string, correlationId?: string) {
    return {
      context,
      correlationId,
      service: 'ai-interview-backend',
    };
  }

  log(message: string, context?: string) {
    this.logger.info(message, this.buildMeta(context));
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { ...this.buildMeta(context), trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, this.buildMeta(context));
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, this.buildMeta(context));
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, this.buildMeta(context));
  }

  /**
   * Log AI inference metrics — token count, latency, cost
   * This is critical for AIP-C01 cost optimization tracking
   */
  logAIInference(data: {
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    estimatedCostUsd?: number;
    context?: string;
  }) {
    this.logger.info('AI inference completed', {
      ...this.buildMeta(data.context ?? 'AI'),
      type: 'ai_inference',
      ...data,
    });
  }
}
