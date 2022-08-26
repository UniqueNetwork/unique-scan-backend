import typeormConfig from '@common/typeorm.config';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from './crawler.service';
import { SubscribersModule } from './subscribers/subscribers.module';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { Config, GlobalConfigModule } from './config/config.module';
import { CacheProviderModule } from './cache/cache-provider.module';
import { ProcessorConfigService } from './config/processor.config.service';

@Module({
  imports: [
    GlobalConfigModule,
    CacheProviderModule,
    TypeOrmModule.forRoot(typeormConfig),
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService<Config>) => {
        return configService.get('sentry');
      },
      inject: [ConfigService],
    }),
    SubscribersModule,
  ],
  controllers: [],
  providers: [Logger, CrawlerService, ProcessorConfigService],
})
export class CrawlerModule {}
