/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import {
  PlaceCategory as PrismaPlaceCategory,
  ActivityType,
  CuratedPlace,
  CuratedPlaceExtension,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

// Define a type that matches the shape of your raw query result
type PlaceQueryResult = CuratedPlace & {
  extension: CuratedPlaceExtension | null;
};

@Injectable()
export class DatePlanService {
  private readonly logger = new Logger(DatePlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateDatePlan(query: GeneratePlanDto) {
    try {
      const { lat, lng, category, budget } = query;
      this.logger.log(`Generating plan for: ${category} near (${lat}, ${lng})`);

      // Step 1: Find the Main Activity
      const mainActivity = await this._findPlace({
        lat,
        lng,
        category: category.toUpperCase() as PrismaPlaceCategory,
        radiusKm: 50,
        budget,
      });
      if (!mainActivity)
        throw new NotFoundException('No suitable main activity.');

      // Step 2: Find a Dinner spot near the Main Activity
      const dinner = await this._findPlace({
        lat: mainActivity.latitude,
        lng: mainActivity.longitude,
        category: 'FOODIE',
        radiusKm: 20, // smaller radius
        budget,
        excludeIds: [mainActivity.id], // Exclude the first place
      });
      if (!dinner)
        throw new NotFoundException(
          'Could not find a suitable dinner spot nearby.',
        );

      // Step 3: Find a Dessert/Drinks spot near Dinner
      const dessert = await this._findPlace({
        lat: dinner.latitude,
        lng: dinner.longitude,
        category: 'RELAXING', // Cafes or bars often fall under this
        radiusKm: 10, // even smaller radius
        budget,
        excludeIds: [mainActivity.id, dinner.id], // Exclude both previous places
      });
      if (!dessert)
        throw new NotFoundException(
          'Could not find a suitable dessert or drinks spot nearby.',
        );

      // Step 4: Assemble and save the plan in a single transaction
      const datePlan = await this.prisma.datePlan.create({
        data: {
          theme: category.toUpperCase() as PrismaPlaceCategory,
          budget,
          steps: {
            create: [
              {
                stepNumber: 1,
                activityType: ActivityType.MAIN_ACTIVITY,
                placeId: mainActivity.id,
              },
              {
                stepNumber: 2,
                activityType: ActivityType.DINNER,
                placeId: dinner.id,
              },
              {
                stepNumber: 3,
                activityType: ActivityType.DESSERT,
                placeId: dessert.id,
              },
            ],
          },
        },
        include: {
          steps: {
            orderBy: {
              stepNumber: 'asc',
            },
            include: {
              place: {
                include: {
                  extension: true,
                },
              },
            },
          },
        },
      });

      return datePlan;
    } catch (error) {
      // This is the standard, safe way to handle all errors
      if (error instanceof Error) {
        this.logger.error(
          `Failed to generate date plan: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          'An unexpected error value was thrown during date plan generation',
          error,
        );
      }
      // Let NestJS handle the final HTTP response
      throw new InternalServerErrorException(
        'Could not generate a date plan. ' + error.message,
      );
    }
  }

  /**
   * Private helper to find a single, suitable place based on criteria.
   * Errors from this function are caught by the main generateDatePlan method.
   */
  private async _findPlace(options: {
    lat: number;
    lng: number;
    category: PrismaPlaceCategory;
    radiusKm: number;
    budget?: number;
    excludeIds?: number[];
  }): Promise<PlaceQueryResult | null> {
    const { lat, lng, category, radiusKm, budget, excludeIds = [] } = options;

    const whereConditions = [
      Prisma.sql`(
          6371 * acos(
            cos(radians(${lat})) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(p.latitude))
          )
        ) < ${radiusKm}`,
      Prisma.sql`p.category = ${category}::"PlaceCategory"`,
    ];

    if (excludeIds.length > 0) {
      whereConditions.push(
        Prisma.sql`p.id NOT IN (${Prisma.join(excludeIds)})`,
      );
    }

    if (budget && budget > 0) {
      whereConditions.push(Prisma.sql`pe."priceMax" <= ${budget}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    const results = await this.prisma.$queryRaw<PlaceQueryResult[]>`
          SELECT p.*, row_to_json(pe.*) as extension
          FROM "CuratedPlace" AS p
          LEFT JOIN "CuratedPlaceExtension" AS pe ON p.id = pe."placeId"
          ${whereClause}
          ORDER BY pe."boostedRate" DESC, random()
          LIMIT 1;
      `;

    return results[0] || null;
  }
}
