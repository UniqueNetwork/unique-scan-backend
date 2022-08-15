import typeormConfig from '@common/typeorm.config';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from './processor.config.service';
import { CrawlerService } from './crawler.service';
import { SubscribersModule } from './subscribers/subscribers.module';
import { ScannersModule } from './scanners/scanners.module';

@Module({
  providers: [Logger, CrawlerService, ProcessorConfigService],
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    ScannersModule,
    SubscribersModule,
  ],
  controllers: [],
})
export class CrawlerModule {}
