import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';

/**
 * @GetUser() — Extract the full user from JWT-authenticated request
 * @GetUser('id') — Extract a specific field
 *
 * Usage:
 *   async getProfile(@GetUser() user: AuthUser) {}
 *   async doSomething(@GetUser('id') userId: string) {}
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: Record<string, unknown> }>();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
