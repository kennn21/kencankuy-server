import { Module } from '@nestjs/common';
import { PhotoWorkerService } from './photo-worker.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { PhotoWorkerController } from './photo-worker.controller';

@Module({
  imports: [ConfigModule, PrismaModule, SupabaseModule],
  providers: [PhotoWorkerService],
  controllers: [PhotoWorkerController],
})
export class PhotoWorkerModule {}
