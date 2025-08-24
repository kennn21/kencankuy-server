// src/google-places/dto/search-by-category.dto.ts
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

// Define the allowed categories as a constant for reusability and type safety
export const validCategories = [
  'ARTSY',
  'FOODIE',
  'ADVENTUROUS',
  'RELAXING',
  'ROMANTIC',
  'SPORTY',
  'ENTERTAINMENT',
] as const;

// Create a TypeScript type from the array
export type PlaceCategory = (typeof validCategories)[number];

export class SearchByCategoryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(validCategories, {
    message: `Category must be one of the following: ${validCategories.join(', ')}`,
  })
  category: PlaceCategory;
}
