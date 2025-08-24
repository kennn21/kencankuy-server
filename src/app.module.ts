// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CuratedPlacesModule } from './modules/curated-places/curated-places.module';
import { GooglePlacesModule } from './modules/google-places/google-places.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { DatePlanModule } from './modules/date-plan/date-plan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes .env variables available globally
    }),
    CuratedPlacesModule,
    GooglePlacesModule,
    PrismaModule,
    DatePlanModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
