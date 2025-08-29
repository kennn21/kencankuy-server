import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export const validCategories = [
  'artsy',
  'foodie',
  'adventurous',
  'relaxing',
  'romantic',
  'sporty',
  'entertainment',
] as const;

export type PlaceCategory = (typeof validCategories)[number];

export class GeneratePlanDto {
  @ApiProperty({
    description: "The latitude of the user's location.",
    example: -6.229728,
  })
  @IsLatitude()
  @Transform(({ value }) => parseFloat(value))
  lat: number;

  @ApiProperty({
    description: "The longitude of the user's location.",
    example: 106.829518,
  })
  @IsLongitude()
  @Transform(({ value }) => parseFloat(value))
  lng: number;

  @ApiProperty({
    description: 'The desired theme for the date plan.',
    enum: validCategories,
    example: 'romantic',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(validCategories)
  category: PlaceCategory;

  @ApiProperty({
    description: 'The maximum budget for the date plan (optional).',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  budget?: number;

  @ApiProperty({
    description:
      'The user ID for whom the date plan is being generated (optional).',
    example: '32E83H4BIF34939F30',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
