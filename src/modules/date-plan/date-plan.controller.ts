import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DatePlanService } from './date-plan.service';
import { GenerateDatePlanResponseDto } from './dto/generate-date-plan-response.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { RateLimitGuard } from 'src/guards/rate-limit.guard';

@Controller('date-plan')
export class DatePlanController {
  constructor(private readonly datePlanService: DatePlanService) {}

  // Get Date Plan by ID
  @Get(':id')
  async getPlanById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const plan = await this.datePlanService.findPlanById(id);
    if (!plan) {
      throw new NotFoundException(`Date plan with ID ${id} not found.`);
    }
    return plan;
  }

  // Generate Date Plan
  @Post('generate')
  @UseGuards(RateLimitGuard)
  async generateDatePlan(
    @Body() body: GeneratePlanDto,
  ): Promise<GenerateDatePlanResponseDto | undefined> {
    return await this.datePlanService.generateDatePlan(body);
  }
}
