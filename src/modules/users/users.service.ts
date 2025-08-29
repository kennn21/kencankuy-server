import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(token: string) {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    return this.prisma.user.upsert({
      where: { id: uid },
      update: { email, name },
      create: { id: uid, email: email ?? '', name },
    });
  }

  async linkPartner(
    userId: string,
    partnerEmail: string,
    partnerName?: string,
  ) {
    // Simply find the current user and update their partner fields
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
}
