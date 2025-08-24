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
  @IsLatitude()
  @Transform(({ value }) => parseFloat(value))
  lat: number;

  @IsLongitude()
  @Transform(({ value }) => parseFloat(value))
  lng: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(validCategories)
  category: PlaceCategory;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  budget?: number;
}
