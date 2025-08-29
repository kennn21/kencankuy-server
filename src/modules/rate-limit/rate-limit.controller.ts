import { Controller, Get, Req } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { Request } from 'express';
import { IsPublic } from 'src/decorators/public.decorator';

@Controller('rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}

  @Get('status')
  @IsPublic()
  async getRateLimitStatus(@Req() request: Request) {
    const ip = request.ip;
    return this.rateLimitService.getStatus(ip!);
  }
}
