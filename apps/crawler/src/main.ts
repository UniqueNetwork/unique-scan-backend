import { NestFactory } from '@nestjs/core';
import { Connection, DataSource } from 'typeorm';
import { CrawlerModule } from './crawler.module';
import { CrawlerService } from './crawler.service';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule);

  // console.log('conn', conn);

  // console.log('app', app);

  // const db = app.get(DataSource);

  // console.log('db', db);

  const crawlerService = app.get(CrawlerService);

  console.log(crawlerService.subscribe());
}
bootstrap();
