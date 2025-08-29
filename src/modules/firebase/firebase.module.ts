import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

@Global() // Make this module global
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
