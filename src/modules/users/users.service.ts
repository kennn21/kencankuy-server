import { Injectable, NotFoundException } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUserFromPayload(decodedToken: DecodedIdToken) {
    const { uid, email, name } = decodedToken;

    const existingUser = await this.prisma.user.findUnique({
      where: { id: uid },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        id: uid,
        email: email ?? '',
        name: name,
      },
    });
  }

  async linkPartner(
    userId: string,
    partnerEmail: string,
    partnerName?: string,
  ) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        partnerEmail: partnerEmail,
        partnerName: partnerName,
      },
    });

    return {
      message: 'Successfully saved partner information.',
      user: updatedUser,
    };
  }

  async updateProfile(
    userId: string,
    data: { name: string; partnerName?: string; partnerEmail?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        partnerName: data.partnerName,
        partnerEmail: data.partnerEmail,
      },
    });
  }

  async findProfileById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }
    return user;
  }
}
