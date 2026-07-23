import type {
  ExceptionFilter,
  ArgumentsHost} from '@nestjs/common';
import {
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';
import { LoggerService } from '../../infrastructure/logger/logger.service';
import type { ApiError } from '@repo/types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = request.headers[CORRELATION_ID_HEADER] as string;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = Array.isArray(res['message'])
          ? (res['message'] as string[]).join(', ')
          : (res['message'] as string) ?? message;
        error = (res['error'] as string) ?? error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.message, exception.stack, 'UnhandledException');
    }

    const errorResponse: ApiError = {
      success: false,
      error,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    // Log 5xx errors as errors, 4xx as warnings
    if (status >= 500) {
      this.logger.error(`${status} ${request.method} ${request.url}: ${message}`, undefined, 'HttpExceptionFilter');
    } else if (status >= 400) {
      this.logger.warn(`${status} ${request.method} ${request.url}: ${message}`, 'HttpExceptionFilter');
    }

    response.status(status).json(errorResponse);
  }
}
