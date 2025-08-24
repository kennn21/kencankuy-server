/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { DatePlanService } from './date-plan.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';

@Controller('date-plan')
export class DatePlanController {
  constructor(private readonly datePlanService: DatePlanService) {}

  @Post('generate')
  async generateDatePlan(
    @Body(new ValidationPipe({ transform: true })) body: GeneratePlanDto,
  ) {
    return this.datePlanService.generateDatePlan(body);
  }

  // You can keep your old GET endpoint for finding single places if you want
  // or remove it.
}
