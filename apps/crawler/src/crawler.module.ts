import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentryModule } from '@ntegral/nestjs-sentry';
import typeormConfig from '@common/typeorm.config';
import { CrawlerService } from './crawler.service';
import { SubscribersModule } from './subscribers/subscribers.module';
import { Config, GlobalConfigModule } from './config/config.module';
import { CacheProviderModule } from './cache/cache-provider.module';

import { HarvesterModule, HarvesterModuleOptions } from '@ashkuc/harvester';

const harvester = HarvesterModule.registerAsync({
  useFactory: () =>
    ({
      chainWsUrl: process.env.CHAIN_WS_URL,
      database: {
        host: process.env.POSTGRES_HOST,
        port: +process.env.POSTGRES_PORT,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
      },
    } as HarvesterModuleOptions),
});

@Module({
  imports: [
    GlobalConfigModule,
    CacheProviderModule,
    TypeOrmModule.forRoot(typeormConfig),
    harvester,
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
