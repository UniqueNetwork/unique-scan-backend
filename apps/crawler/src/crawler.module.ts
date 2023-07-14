import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentryModule } from '@ntegral/nestjs-sentry';
import typeormConfig from '@common/typeorm.config';
import { CrawlerService } from './crawler.service';
import { SubscribersModule } from './subscribers/subscribers.module';
import { Config, GlobalConfigModule } from './config/config.module';
import { CacheProviderModule } from './cache/cache-provider.module';
import { HarvesterModule, HarvesterModuleOptions } from '@unique-nft/harvester';
import { MonitoringModule } from '@common/monitoring';

@Module({
  imports: [
    GlobalConfigModule,
    CacheProviderModule,
    MonitoringModule,
    TypeOrmModule.forRoot(typeormConfig),
    HarvesterModule.registerAsync({
      useFactory: (config: ConfigService<Config>) =>
        ({
          chainWsUrl: config.get('chainWsUrl'),
          databaseConfig: typeormConfig,
        } as HarvesterModuleOptions),
      inject: [ConfigService],
    }),
    SentryModule.forRootAsync({
      useFactory: async (configService: ConfigService<Config>) => {
        return configService.get('sentry');
      },
      inject: [ConfigService],
    }),
    SubscribersModule,
  ],
  controllers: [],
  providers: [CrawlerService],
})
export class CrawlerModule {}
