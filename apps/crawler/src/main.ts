import { NestFactory } from '@nestjs/core';
import { SentryService } from '@ntegral/nestjs-sentry';
import { CrawlerModule } from './crawler.module';
import { CrawlerService } from './crawler.service';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule, {
    // logger: ['error', 'warn', 'verbose'],
    logger: false,
  });

  // app.useLogger(SentryService.SentryServiceInstance());

  try {
    const crawlerService = app.get(CrawlerService);

    await crawlerService.subscribe(process.env.SCAN_FORCE_RESCAN === 'true');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

bootstrap();
