// src/main.ts
import { ValidationPipe } from '@nestjs/common'; // 1. Import it
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: [
      'https://www.kencankuy.id', // Your production domain
      'http://localhost:3000', // Your local development domain
      // 'http://localhost:3001', // Your local development domain
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'Content-Type',
      'Authorization',
    ],
  });

  // Add the global pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away any properties that don't have decorators
      forbidNonWhitelisted: true, // Throws an error if unknown properties are sent
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('KencanKuy API')
    .setDescription(
      'The official API documentation for the KencanKuy application.',
    )
    .setVersion('1.0')
    .addBearerAuth() // If you use Bearer token auth
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // The UI will be available at /api

  await app.listen(8080);
}
bootstrap();
