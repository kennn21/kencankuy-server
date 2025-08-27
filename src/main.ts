// src/main.ts
import { ValidationPipe } from '@nestjs/common'; // 1. Import it
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // This single line enables the shutdown hooks
  app.enableShutdownHooks();

  app.enableCors({
    // Add the names of the headers you want the browser to expose
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  });

  // Tell NestJS to trust the proxy headers from Vercel
  app.set('trust proxy', 1);

  // Add the global pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any properties that don't have decorators
      forbidNonWhitelisted: true, // Throws an error if unknown properties are sent
    }),
  );

  await app.listen(8081);
}
bootstrap();
