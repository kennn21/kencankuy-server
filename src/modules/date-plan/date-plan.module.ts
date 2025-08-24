import { Module } from '@nestjs/common';
import { DatePlanController } from './date-plan.controller';
import { DatePlanService } from './date-plan.service';
import { PrismaModule } from '../prisma/prisma.module';
// PrismaService is globally available via PrismaModule, so no need to import it here

@Module({
  imports: [PrismaModule],
  controllers: [DatePlanController],
  providers: [DatePlanService],
})
export class DatePlanModule {}
