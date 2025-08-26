import { IsNumber, IsObject, IsString } from 'class-validator';

export class GenerateDatePlanResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  theme: string;

  @IsObject()
  steps: {
    stepNumber: number;
    activityType: string;
    placeId: number;
  }[];
}
