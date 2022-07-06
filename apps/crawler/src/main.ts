import { NestFactory } from '@nestjs/core';
import { CrawlerModule } from './crawler.module';
import { CrawlerService } from './crawler.service';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule, {
    logger: [
      'log',
      'error',
      'warn',
      // 'verbose'
    ],
  });

  const crawlerService = app.get(CrawlerService);

  crawlerService.subscribeAll(process.env.SCAN_FORCE_RESCAN === 'true');
}
bootstrap();
