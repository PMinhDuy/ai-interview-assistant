import type {
  NestInterceptor,
  ExecutionContext,
  CallHandler} from '@nestjs/common';
import {
  Injectable
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const correlationId = request.headers[CORRELATION_ID_HEADER];
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const latency = Date.now() - start;
          this.logger.log(
            `${method} ${url} → 200 [${latency}ms] correlationId=${correlationId}`,
            'HTTP',
          );
        },
        error: () => {
          // Errors are logged in the exception filter
        },
      }),
    );
  }
}
