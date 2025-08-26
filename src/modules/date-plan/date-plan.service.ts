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
import { GenerateDatePlanResponseDto } from './dto/generate-date-plan-response.dto';

// Define a type that matches the shape of your raw query result
type PlaceQueryResult = CuratedPlace & {
  extension: CuratedPlaceExtension | null;
};

// 1. Abstracting hardcoded values
const ITINERARY_CONFIG = [
  { activityType: ActivityType.MAIN_ACTIVITY, category: null, radiusKm: 50 },
  { activityType: ActivityType.DINNER, category: 'FOODIE', radiusKm: 20 },
  { activityType: ActivityType.DESSERT, category: 'RELAXING', radiusKm: 10 },
];

@Injectable()
export class DatePlanService {
  private readonly logger = new Logger(DatePlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateDatePlan(
    query: GeneratePlanDto,
  ): Promise<GenerateDatePlanResponseDto> {
    try {
      const { lat, lng, category, budget } = query;
      this.logger.log(`Generating plan for: ${category} near (${lat}, ${lng})`);

      // 2. Dynamic Itinerary Building
      const planSteps: {
        stepNumber: number;
        activityType: ActivityType;
        placeId: number;
      }[] = [];
      let currentLat = lat;
      let currentLng = lng;
      const excludeIds: number[] = [];

      for (const stepConfig of ITINERARY_CONFIG) {
        const stepCategory = (stepConfig.category ||
          category.toUpperCase()) as PrismaPlaceCategory;

        const place = await this._findPlace({
          lat: currentLat,
          lng: currentLng,
          category: stepCategory,
          radiusKm: stepConfig.radiusKm,
          budget,
          excludeIds,
        });

        if (!place) {
          throw new NotFoundException(
            `Could not find a suitable place for step: ${stepConfig.activityType}.`,
          );
        }

        planSteps.push({
          stepNumber: planSteps.length + 1,
          activityType: stepConfig.activityType,
          placeId: place.id,
        });

        // Update location for the next search
        currentLat = place.latitude;
        currentLng = place.longitude;
        excludeIds.push(place.id);
      }

      // 3. Assemble and save the dynamically created plan
      const datePlan = await this.prisma.datePlan.create({
        data: {
          theme: category.toUpperCase() as PrismaPlaceCategory,
          budget,
          steps: {
            create: planSteps,
          },
        },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
            include: { place: { include: { extension: true } } },
          },
        },
      });

      return datePlan;
    } catch (error) {
      if (error instanceof Error) {
        // Log the detailed error for developers
        this.logger.error(
          `Failed to generate date plan: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error('An unexpected error value was thrown', error);
      }

      // Return a generic, safe error message to the user
      throw new InternalServerErrorException(
        'Could not generate a date plan. Please try again later.',
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

  async findPlanById(id: number) {
    this.logger.log(`Fetching date plan with ID: ${id}`);
    return this.prisma.datePlan.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepNumber: 'asc' },
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
  }
}
