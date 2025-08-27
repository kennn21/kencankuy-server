import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key must be provided.');
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
    this.logger.log('Supabase client initialized.');
  }

  /**
   * Uploads a file to a specified Supabase Storage bucket.
   * @param fileBuffer The file content as a Buffer.
   * @param fileName The desired name for the file in the bucket.
   * @param bucket The name of the bucket to upload to.
   * @returns The public URL of the uploaded file.
   */
  async upload(
    fileBuffer: ArrayBuffer,
    fileName: string,
    bucket: string,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      this.logger.error(
        `Failed to upload to Supabase bucket "${bucket}"`,
        error,
      );
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.client.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl;
  }

  // You can keep this method if other services need direct client access
  getClient(): SupabaseClient {
    return this.client;
  }
}
