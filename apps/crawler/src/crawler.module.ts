import typeormConfig from '@common/typeorm.config';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from './processor.config.service';
import { CrawlerService } from './crawler.service';
import { SubscribersModule } from './subscribers/subscribers.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    SubscribersModule,
  ],
  controllers: [],
  providers: [Logger, CrawlerService, ProcessorConfigService],
})
export class CrawlerModule {}
