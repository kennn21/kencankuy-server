import { Injectable, Logger } from '@nestjs/common';
import {
  ActivityType,
  PlaceCategory,
  PlaceCategory as PrismaPlaceCategory,
} from '@prisma/client';
import { deg2rad } from 'src/utils/deg2rad';
import { validCategories } from '../google-places/dto/search-by-category.dto';
import { GooglePlacesService } from '../google-places/google-places.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddressType, Place } from '@googlemaps/google-maps-services-js';

@Injectable()
export class CuratedPlacesService {
  private readonly logger = new Logger(CuratedPlacesService.name);

  constructor(
    private readonly googlePlacesService: GooglePlacesService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Finds curated places that match a specific theme, price level, and are within a certain radius
   * of a given location. This method queries the local curated database,
   * not an external API.
   *
   * @param theme The theme to filter by (e.g., 'artsy', 'foodie').
   * @param priceLevel The price level to filter by (e.g., 'low', 'mid-range', 'high').
   * @param latitude The central latitude for the search radius.
   * @param longitude The central longitude for the search radius.
   * @param radiusKm The search radius in kilometers.
   * @returns An array of curated place objects.
   */
  async findCuratedPlaces(
    theme: string,
    priceLevel: string,
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<any[]> {
    // Note: It's better to define a proper return type than 'any[]'
    const places = await this.prisma.curatedPlace.findMany({
      where: {
        category: theme.toUpperCase() as PrismaPlaceCategory,
      },
    });

    // Filtering by proximity using the Haversine formula
    return places.filter((place) => {
      const R = 6371; // Radius of Earth in km
      const dLat = deg2rad(latitude - place.latitude);
      const dLng = deg2rad(longitude - place.longitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(place.latitude)) *
          Math.cos(deg2rad(latitude)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance <= radiusKm;
    });
  }

  /**
   * Generates a random price range for a new place.
   */
  private _generatePriceRange(): { priceMin: number; priceMax: number | null } {
    // Decide if this place should be high-end (e.g., 15% chance)
    if (Math.random() < 0.15) {
      return {
        priceMin: 300000,
        priceMax: null, // Represents "300k and up"
      };
    }

    // Generate a random priceMin between 50k and 280k
    // We use 280k to ensure there's room for priceMax
    const min = Math.floor(Math.random() * (280000 - 50000 + 1)) + 50000;

    // Generate a random priceMax between priceMin and 300k
    const max = Math.floor(Math.random() * (300000 - min + 1)) + min;

    return {
      priceMin: min,
      priceMax: max,
    };
  }

  /**
   * Private helper to determine the ActivityType based on Google's data.
   */

  private _inferActivityType(
    place: Place,
    kencanKuyCategory: PlaceCategory,
  ): ActivityType | null {
    const googleTypes = place.types || [];

    if (
      googleTypes.includes(AddressType.restaurant) ||
      googleTypes.includes(AddressType.meal_takeaway)
    ) {
      return ActivityType.DINNER;
    }
    if (googleTypes.includes(AddressType.cafe)) {
      return ActivityType.COFFEE;
    }
    if (googleTypes.includes(AddressType.bar)) {
      return ActivityType.DRINKS;
    }

    // If it's a "foodie" place but not a restaurant/cafe, it's still a main activity
    if (kencanKuyCategory === 'FOODIE') {
      return ActivityType.MAIN_ACTIVITY;
    }

    // For other categories, we can assume it's the main activity
    if (
      ['artsy', 'adventurous', 'romantic', 'sporty', 'entertainment'].includes(
        kencanKuyCategory,
      )
    ) {
      return ActivityType.MAIN_ACTIVITY;
    }

    // Default to null if no specific type can be inferred
    return null;
  }

  async findAndStorePlaces() {
    this.logger.log(
      'Starting job to find and store new places from Google API...',
    );
    const summary = { totalNewPlaces: 0, details: {} };

    for (const category of validCategories) {
      this.logger.log(`Fetching places for category: "${category}"`);

      const googlePlacesResult =
        await this.googlePlacesService.findPlacesByCategory(
          category as PlaceCategory,
        );
      const placesFromGoogle = googlePlacesResult.data;
      let newPlacesCount = 0;

      if (!placesFromGoogle || placesFromGoogle.length === 0) {
        this.logger.warn(`No places found for category: "${category}"`);
        continue;
      }

      for (const place of placesFromGoogle) {
        if (!place.place_id) continue;

        const existingPlace = await this.prisma.curatedPlace.findUnique({
          where: { googlePlaceId: place.place_id },
        });

        if (!existingPlace) {
          try {
            // Infer the activity type before creating the record
            const inferredActivityType = this._inferActivityType(
              place,
              category as PlaceCategory,
            );
            const priceRange = this._generatePriceRange(); // TODO: Disable for production

            // Get the first photo reference, if one exists
            const photoReference =
              place.photos && place.photos.length > 0
                ? place.photos[0].photo_reference
                : null;

            if (place.geometry)
              await this.prisma.curatedPlace.create({
                data: {
                  googlePlaceId: place.place_id,
                  name: place.name ?? '',
                  address: place.formatted_address,
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                  photoReference: photoReference,
                  category: category.toUpperCase() as PrismaPlaceCategory,
                  activityType: inferredActivityType, // Save the inferred type
                  extension: {
                    create: {
                      priceMin: priceRange.priceMin, // TODO: Disable for production
                      priceMax: priceRange.priceMax, // TODO: Disable for production
                    },
                  },
                },
              });
            newPlacesCount++;
            this.logger.log(`Added new place: "${place.name}"`);
          } catch (error) {
            if (error instanceof Error) {
              this.logger.error(
                `Failed to add place "${place.name}". Error: ${error.message}`,
              );
            }
          }
        }
      }
      summary.details[category] = { added: newPlacesCount };
      summary.totalNewPlaces += newPlacesCount;
    }

    this.logger.log('Finished job. Summary:', summary);
    return summary;
  }

  // Add this to your existing CuratedPlacesService class

  /**
   * Scans the database for any CuratedPlace records that are missing their
   * corresponding CuratedPlaceExtension and creates them.
   * This is a utility method for data maintenance.
   */
  async fillMissingExtensions() {
    this.logger.log('Starting job to fill missing extension data...');

    // 1. Find all places that do NOT have an extension record linked to them.
    //    We only select the 'id' to keep the query lightweight.
    const placesMissingExtension = await this.prisma.curatedPlace.findMany({
      where: {
        extension: null,
      },
      select: {
        id: true,
      },
    });

    if (placesMissingExtension.length === 0) {
      this.logger.log('No places are missing extension data. All good!');
      return {
        message: 'No places were missing extension data.',
        extensionsCreated: 0,
      };
    }

    this.logger.log(
      `Found ${placesMissingExtension.length} places missing extension data. Creating them now...`,
    );

    // 2. Prepare the data for the bulk creation.
    //    We map each place ID to the required 'placeId' foreign key.
    const extensionsToCreate = placesMissingExtension.map((place) => ({
      placeId: place.id,
    }));

    // 3. Use 'createMany' to insert all missing extensions in a single, efficient database transaction.
    const result = await this.prisma.curatedPlaceExtension.createMany({
      data: extensionsToCreate,
    });

    this.logger.log(
      `Successfully created ${result.count} new extension records.`,
    );

    return {
      message: 'Successfully filled all missing extension data.',
      extensionsCreated: result.count,
    };
  }
}
