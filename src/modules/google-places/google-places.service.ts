import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@googlemaps/google-maps-services-js';
import { PlaceCategory } from './dto/search-by-category.dto';

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private googleMapsClient: Client;

  // Maps your abstract categories to concrete Google search queries
  private readonly CATEGORY_SEARCH_QUERIES: Record<PlaceCategory, string> = {
    ARTSY: 'art galleries and museums in Jakarta',
    FOODIE: 'best restaurants and unique cafes in Jakarta',
    ADVENTUROUS: 'escape rooms and adventure parks in Jakarta',
    RELAXING: 'spas and quiet parks in Jakarta',
    ROMANTIC: 'romantic restaurants with a view in Jakarta',
    SPORTY: 'sports centers and futsal fields in Jakarta',
    ENTERTAINMENT: 'cinemas and live music venues in Jakarta',
  };

  constructor(private configService: ConfigService) {
    this.googleMapsClient = new Client({});
  }

  async findPlacesByCategory(category: PlaceCategory) {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'Google Maps API Key is not configured.',
      );
    }

    const query = this.CATEGORY_SEARCH_QUERIES[category];
    if (!query) {
      throw new NotFoundException(
        `Search query for category "${category}" not found.`,
      );
    }

    this.logger.log(
      `Searching for category: "${category}" with query: "${query}"`,
    );

    try {
      const response = await this.googleMapsClient.textSearch({
        params: {
          query,
          key: apiKey,
        },
      });

      const places = response.data.results;

      this.logger.log(
        `Found ${places.length} places for category "${category}".`,
      );

      // --- FIX IS HERE ---
      // We now return the full 'places' array, which includes place_id, geometry, etc.
      return {
        message: `Successfully found and processed ${places.length} places for the "${category}" category.`,
        data: places, // Return the complete place objects, not a simplified version.
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to fetch from Google Places API: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('An unexpected error occurred', error);
      }
      throw new InternalServerErrorException(
        'Failed to fetch data from Google Places API.',
      );
    }
  }
}
