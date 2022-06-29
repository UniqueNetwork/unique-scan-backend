import { NestFactory } from '@nestjs/core';
import { CrawlerModule } from './crawler.module';
import { CrawlerService } from './crawler.service';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule);

  const crawlerService = app.get(CrawlerService);

  console.log(crawlerService.getHello());
}
bootstrap();
