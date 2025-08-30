// src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { redisStore } from 'cache-manager-redis-store';
import { OptionalFirebaseAuthGuard } from './guards/optional-firebase-auth.guard';
import { CuratedPlacesModule } from './modules/curated-places/curated-places.module';
import { DatePlanModule } from './modules/date-plan/date-plan.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { GooglePlacesModule } from './modules/google-places/google-places.module';
import { PhotoWorkerModule } from './modules/photo-worker/photo-worker.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, // Make cache available globally
      store: redisStore,
      host: process.env.UPSTASH_REDIS_REST_URL, // Your Redis host
      port: 6379, // Your Redis port
      ttl: 60 * 60 * 24, // Cache items for 24 hours
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Makes .env variables available globally
    }),
    CuratedPlacesModule,
    GooglePlacesModule,
    PrismaModule,
    DatePlanModule,
    SupabaseModule,
    PhotoWorkerModule,
    RateLimitModule,
    UsersModule,
    FirebaseModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: OptionalFirebaseAuthGuard,
    },
  ],
})
export class AppModule {}
