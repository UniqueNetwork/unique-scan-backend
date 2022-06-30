import typeormConfig from '@common/typeorm.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Model } from './model';
import { CrawlerService } from './crawler.service';
import { CollectionsProcessor } from './collections-processor';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    TypeOrmModule.forFeature([
      Model,
    ]),
  ],
  controllers: [],
  providers: [
    CollectionsProcessor,
    CrawlerService,
  ],
})
export class CrawlerModule {}
