import { Module } from '@nestjs/common';
import { CuratedPlacesController } from './curated-places.controller';
import { CuratedPlacesService } from './curated-places.service';
import { GooglePlacesModule } from '../google-places/google-places.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [GooglePlacesModule],
  controllers: [CuratedPlacesController],
  providers: [CuratedPlacesService, PrismaService],
})
export class CuratedPlacesModule {}
