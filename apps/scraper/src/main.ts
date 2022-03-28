import { NestFactory } from '@nestjs/core';
import { ScraperModule } from './scraper.module';

async function bootstrap() {
  await NestFactory.create(ScraperModule);
}
bootstrap();
