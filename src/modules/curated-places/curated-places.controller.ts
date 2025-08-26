import {
  Controller,
  Get,
  Query,
  BadRequestException,
  HttpCode,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { CuratedPlacesService } from './curated-places.service';

@Controller('curated-places')
export class CuratedPlacesController {
  constructor(private readonly curatedPlacesService: CuratedPlacesService) {}

  @Get('curated')
  async getCuratedPlaces(
    @Query('theme') theme: string,
    @Query('priceLevel') priceLevel: string,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string = '15000', // Default radius of 15km
  ): Promise<any> {
    if (!theme) {
      throw new BadRequestException('Missing required query parameter: theme');
    }

    // Optional validation for priceLevel if you want to ensure it's one of your tiers
    const validPriceLevels = ['low', 'mid-range', 'high'];
    if (priceLevel && !validPriceLevels.includes(priceLevel)) {
      throw new BadRequestException(
        'Invalid priceLevel. Must be one of: low, mid-range, high',
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseInt(radius, 10);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
      // In a real app, you might handle this by searching the entire database
      // if lat/lng are missing, or returning a more specific error.
      throw new BadRequestException(
        'Invalid numerical values for lat, lng, or radius',
      );
    }

    // The controller now just passes all the parameters to the service.
    // The service is responsible for all the filtering logic.
    return await this.curatedPlacesService.findCuratedPlaces(
      theme,
      priceLevel,
      latitude,
      longitude,
      searchRadius,
    );
  }

  /**
   * Triggers a job to fetch places for all categories from the Google Places API
   * and store any new ones in the local database.
   *
   * This is an administrative endpoint and should be protected in a real application.
   */
  @Post('sync-with-google')
  @HttpCode(HttpStatus.OK) // Responds with 200 OK on success
  async syncPlacesWithGoogle() {
    const summary = await this.curatedPlacesService.findAndStorePlaces();
    return {
      message: 'Sync job completed successfully.',
      data: summary,
    };
  }

  /**
   * Triggers a maintenance job to find and create any missing
   * CuratedPlaceExtension records in the database.
   */
  @Post('fill-missing-extensions')
  @HttpCode(HttpStatus.OK)
  async fillMissingExtensions() {
    const summary = await this.curatedPlacesService.fillMissingExtensions();
    return {
      message: 'Fill missing extensions job completed.',
      data: summary,
    };
  }
}
