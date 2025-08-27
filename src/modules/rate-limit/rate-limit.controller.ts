import { Controller, Get, Req } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { Request } from 'express';

@Controller('rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}

  @Get('status')
  async getRateLimitStatus(@Req() request: Request) {
    const ip = request.ip;
    return this.rateLimitService.getStatus(ip!);
  }
}
