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

  // Use PORT environment variable for Cloud Run compatibility
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server is running on port ${port}`);
  console.log('📁 Using Google Cloud Storage for file uploads');
}
bootstrap();
