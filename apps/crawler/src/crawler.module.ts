import typeormConfig from '@common/typeorm.config';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from './processor.config.service';
import { CrawlerService } from './crawler.service';
import { SubscribersModule } from './subscribers/subscribers.module';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { Config, GlobalConfigModule } from './config/config.module';

@Module({
  imports: [
    GlobalConfigModule,
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
