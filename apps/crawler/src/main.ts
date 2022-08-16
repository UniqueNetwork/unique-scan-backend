import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { CrawlerModule } from './crawler.module';
import { CrawlerService } from './crawler.service';

async function bootstrap() {
  const app = await NestFactory.create(CrawlerModule);

  const configService = app.get(ConfigService);

  const logLevels = configService.get('LOG_LEVELS')
    ? configService.get('LOG_LEVELS').split(',')
    : ['log', 'error', 'warn'];

  Logger.overrideLogger(logLevels);

  try {
    const crawlerService = app.get(CrawlerService);

    await crawlerService.run(process.env.SCAN_FORCE_RESCAN === 'true');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

(async function () {
  await bootstrap();
})();
