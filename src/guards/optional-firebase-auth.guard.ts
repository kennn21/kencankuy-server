import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalFirebaseAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // If a token is present, try to validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        request.user = decodedToken;
      } catch (error) {
        // Log the specific Firebase error if token validation fails
        this.logger.error('Firebase token verification failed', error);
        // Treat as an anonymous user if the token is invalid
        request.user = null;
      }
    }

    // Always allow the request to proceed, whether the user is authenticated or not
    return true;
  }
}
