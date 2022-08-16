import typeormConfig from '@common/typeorm.config';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from './processor.config.service';
import { CrawlerService } from './crawler.service';
import { SubscribersModule } from './subscribers/subscribers.module';
import { ScannersModule } from './scanners/scanners.module';
import { SentryModule } from '@ntegral/nestjs-sentry';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    ScannersModule,
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        dsn: config.get('SENTRY_DSN'),
        debug: config.get('SENTRY_DEBUG') === '1',
        environment: process.env.NODE_ENV ?? 'development',
        logLevels: config.get('SENTRY_LOG_LEVELS')
          ? config.get('SENTRY_LOG_LEVELS').split(',')
          : ['error'],
        enabled: !!config.get('SENTRY_DSN'),
      }),
      inject: [ConfigService],
    }),
    SubscribersModule,
  ],
  controllers: [],
  providers: [Logger, CrawlerService, ProcessorConfigService],
})
export class CrawlerModule {}
