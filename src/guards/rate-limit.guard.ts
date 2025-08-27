import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request: Request = http.getRequest();
    const response = http.getResponse();

    // --- THIS IS THE UPDATED LOGIC ---
    // Read the IP from the 'X-Forwarded-For' header, or fall back to request.ip
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.ip;

    if (!ip) {
      // If no IP can be determined, allow the request to prevent blocking valid users
      return true;
    }

    const key = `rate-limit:${ip}`;
    const limit = 5;

    const count = (await this.cacheManager.get<number>(key)) || 0;
    const remaining = Math.max(0, limit - (count + 1));

    response.header('X-RateLimit-Limit', limit);
    response.header('X-RateLimit-Remaining', remaining);

    if (count >= limit) {
      throw new ThrottlerException(
        'You have exceeded your request limit. Please sign in to continue.',
      );
    }

    await this.cacheManager.set(key, count + 1);

    return true;
  }
}
