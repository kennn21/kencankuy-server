import { Controller, Post, Body, UseGuards, Patch, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { LinkPartnerDto } from './dto/link-partner.dto';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from 'src/decorators/user.decorator';
import { DecodedIdToken } from 'firebase-admin/auth';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  async syncUser(@User() user: DecodedIdToken) {
    // The token is already verified by the guard. We just need the payload.
    // The service can now be simplified to accept the decoded token payload.
    return this.usersService.syncUserFromPayload(user);
  }

  @Post('link-partner')
  async linkPartner(
    @User() user: DecodedIdToken,
    @Body() body: LinkPartnerDto,
  ) {
    // The userId now comes from the trusted token, not the untrusted body
    const userId = user.uid;
    return this.usersService.linkPartner(
      userId,
      body.partnerEmail,
      body.partnerName,
    );
  }

  @Patch('me')
  async updateProfile(
    @User() user: DecodedIdToken, // 4. Cleaner way to get the user
    @Body() body: UpdateProfileDto,
  ) {
    const userId = user.uid;
    return this.usersService.updateProfile(userId, body);
  }

  @Get('me')
  async getMyProfile(@User() user: DecodedIdToken) {
    // 5. Cleaner way to get the user
    const userId = user.uid;
    return this.usersService.findProfileById(userId);
  }
}
