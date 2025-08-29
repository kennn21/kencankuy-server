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
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { User } from 'src/decorators/user.decorator';
import { OptionalFirebaseAuthGuard } from 'src/guards/optional-firebase-auth.guard';
import { RateLimitGuard } from 'src/guards/rate-limit.guard';
import { DatePlanService } from './date-plan.service';
import { GenerateDatePlanResponseDto } from './dto/generate-date-plan-response.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';

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
  @UseGuards(RateLimitGuard, OptionalFirebaseAuthGuard)
  async generateDatePlan(
    @User() user: DecodedIdToken,
    @Body() body: GeneratePlanDto,
  ): Promise<GenerateDatePlanResponseDto | undefined> {
    console.log(user);
    return await this.datePlanService.generateDatePlan({
      ...body,
      userId: user?.uid,
    });
  }
}
