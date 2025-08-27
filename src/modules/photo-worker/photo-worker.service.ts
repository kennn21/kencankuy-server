import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js'; // Import the client
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PhotoWorkerService {
  private readonly logger = new Logger(PhotoWorkerService.name);
  private googleMapsClient: Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.googleMapsClient = new Client({});
  }

  async processPhotoQueue(batchSize = 10) {
    this.logger.log(
      `Starting photo processing job for a batch of ${batchSize}...`,
    );

    const placesToProcess = await this.prisma.curatedPlace.findMany({
      where: { photoReference: { not: null }, cachedPhotoUrl: null },
      take: batchSize,
    });

    if (placesToProcess.length === 0) {
      this.logger.log('No photos to process. Job finished.');
      return { message: 'No photos to process.', processedCount: 0 };
    }

    let processedCount = 0;
    for (const place of placesToProcess) {
      try {
        // --- THIS IS THE NEW LOGIC ---
        // 1. Call the dedicated getPhoto method from the client library
        const photoResponse = await this.googleMapsClient.placePhoto({
          params: {
            photoreference: place.photoReference!,
            maxwidth: 800,
            key: this.configService.get('GOOGLE_MAPS_API_KEY')!,
          },
          responseType: 'arraybuffer', // Get the image data directly
        });
        if (photoResponse.status !== 200) {
          throw new Error(
            `Failed to fetch photo for ${place.name}, status code: ${photoResponse.status}`,
          );
        }

        // 2. Upload the buffer to Supabase
        const imageBuffer = photoResponse.data as unknown as ArrayBuffer;
        const cachedPhotoUrl = await this.supabaseService.upload(
          imageBuffer,
          `${place.googlePlaceId}.jpg`,
          'kencankuy-public',
        );

        // 3. Update the record in the database
        await this.prisma.curatedPlace.update({
          where: { id: place.id },
          data: {
            cachedPhotoUrl: cachedPhotoUrl,
            needsPhotoProcessing: false,
          },
        });

        this.logger.log(`Successfully processed photo for: ${place.name}`);
        processedCount++;

        // 4. Throttle the requests to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Failed to process photo for ${place.name}: ${error.message}`,
          );
          await this.prisma.curatedPlace.update({
            where: { id: place.id },
            data: { needsPhotoProcessing: false },
          });
        }
      }
    }

    this.logger.log(
      `Photo processing job finished. Processed ${processedCount} photos.`,
    );
    return { message: 'Batch processing complete.', processedCount };
  }
}
