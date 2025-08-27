import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PhotoWorkerService } from './photo-worker.service';

@Controller('photo-worker')
export class PhotoWorkerController {
  private readonly logger = new Logger(PhotoWorkerController.name);

  constructor(private readonly photoWorkerService: PhotoWorkerService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line @typescript-eslint/require-await
  async runPhotoProcessingJob() {
    this.logger.log('Manually triggering photo processing job via API.');
    // We don't 'await' this so the HTTP request can return immediately
    // while the job runs in the background.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.photoWorkerService.processPhotoQueue();
    return { message: 'Photo processing job started in the background.' };
  }
}
