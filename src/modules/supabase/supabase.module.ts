import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // Makes the SupabaseService available globally
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
