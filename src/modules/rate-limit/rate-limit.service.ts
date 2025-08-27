import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RateLimitService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getStatus(ip: string) {
    const key = `rate-limit:${ip}`;
    const limit = 5;
    const count = (await this.cacheManager.get<number>(key)) || 0;
    const remaining = Math.max(0, limit - count);

    return {
      limit,
      remaining,
    };
  }
}
