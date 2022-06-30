import typeormConfig from '@common/typeorm.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from './crawler.service';
import { CollectionsProcessor } from './collections-processor';
import { Collections } from '@entities/Collections';
import { SdkService } from './sdk.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    TypeOrmModule.forFeature([Collections]),
  ],
  controllers: [],
  providers: [SdkService, CollectionsProcessor, CrawlerService],
})
export class CrawlerModule {}
