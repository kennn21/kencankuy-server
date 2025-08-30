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
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { RateLimitGuard } from 'src/guards/rate-limit.guard';
import { DatePlanService } from './date-plan.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';

@Controller('date-plan')
export class DatePlanController {
  constructor(private readonly datePlanService: DatePlanService) {}

  @Get('my-plans')
  @UseGuards(FirebaseAuthGuard)
  async getMyPlans(@User() user: DecodedIdToken) {
    return this.datePlanService.findPlansByUserId(user.uid);
  }

  // Get Date Plan by ID
  @Get(':id')
  async getPlanById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const plan = await this.datePlanService.findPlanById(id);
    if (!plan) {
      throw new NotFoundException(`Date plan with ID ${id} not found.`);
    }
    return plan;
  }

  @Post('generate')
  @UseGuards(RateLimitGuard) // Only the RateLimitGuard is needed now
  async generateDatePlan(
    @User() user: DecodedIdToken, // The @User decorator will get the user if they are logged in
    @Body() body: GeneratePlanDto,
  ) {
    const userId = user?.uid; // Will be undefined for guests, populated for users
    return await this.datePlanService.generateDatePlan(body, userId);
  }
}
