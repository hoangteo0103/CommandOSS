import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS.
  app.enableCors();

  // Global validation pipe.
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Server is running on http://localhost:3000');
  console.log('📁 Using Google Cloud Storage for file uploads');
}
bootstrap();
