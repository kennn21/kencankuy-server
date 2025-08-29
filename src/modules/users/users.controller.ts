import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  Body,
  UseGuards,
  Patch,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LinkPartnerDto } from './dto/link-partner.dto';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  async syncUser(@Headers('authorization') authHeader: string) {
    if (!authHeader) throw new UnauthorizedException('No authorization header');
    const token = authHeader.split('Bearer ')[1];
    if (!token) throw new UnauthorizedException('Invalid token format');
    return this.usersService.syncUser(token);
  }

  @Post('link-partner')
  async linkPartner(
    @Body() body: LinkPartnerDto & { userId: string }, // Assume userId is passed for now
  ) {
    return this.usersService.linkPartner(
      body.userId,
      body.partnerEmail,
      body.partnerName,
    );
  }

  @Patch('me') // PATCH is standard for partial updates
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(
    @Req() request: any, // request will have the 'user' property from the guard
    @Body() body: UpdateProfileDto,
  ) {
    const userId = request.user.uid;
    return this.usersService.updateProfile(userId, body);
  }
}
