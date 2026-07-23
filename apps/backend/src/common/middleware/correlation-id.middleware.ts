import type { NestMiddleware } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Correlation ID Middleware
 *
 * Attaches a unique correlation ID to every request.
 * - If the client sends X-Correlation-Id, we use it (for frontend tracing)
 * - Otherwise we generate a new UUID
 *
 * The ID is forwarded in the response header so clients can correlate
 * their requests with backend logs.
 *
 * AWS equivalent: API Gateway request ID / X-Ray trace ID
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existingId = req.headers[CORRELATION_ID_HEADER] as string | undefined;
    const correlationId = existingId ?? uuidv4();

    req.headers[CORRELATION_ID_HEADER] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
