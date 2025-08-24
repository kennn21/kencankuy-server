import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes the module available globally
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export the service to be used in other modules
})
export class PrismaModule {}
