import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ThrottlerException } from '@nestjs/throttler';
import { FirebaseService } from 'src/modules/firebase/firebase.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private firebaseService: FirebaseService, // 1. Inject FirebaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 2. Check for an authenticated user first
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        // If token is valid, user is authenticated
        await this.firebaseService.getAuth().verifyIdToken(token);
        // Bypass the IP limit for logged-in users
        return true;
      } catch (error: unknown) {
        console.log(error);
        // Invalid token, treat as a guest
      }
    }

    // 3. If no valid token, proceed with the original IP-based limit for guests
    const ip = request.ip;
    const key = `rate-limit:${ip}`;
    const limit = 5;
    const count = (await this.cacheManager.get<number>(key)) || 0;

    if (count >= limit) {
      throw new ThrottlerException(
        'You have exceeded your request limit. Please sign in for unlimited access.',
      );
    }

    const remaining = Math.max(0, limit - (count + 1));
    response.header('X-RateLimit-Limit', limit);
    response.header('X-RateLimit-Remaining', remaining);

    await this.cacheManager.set(key, count + 1);

    return true;
  }
}
