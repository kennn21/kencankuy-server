import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: privateKey?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  getAuth(): admin.auth.Auth {
    return admin.auth();
  }
}
