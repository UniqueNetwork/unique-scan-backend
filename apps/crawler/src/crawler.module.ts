import typeormConfig from '@common/typeorm.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from './crawler.service';
import { CollectionsProcessor } from './collections-processor';
import { Collections } from '@entities/Collections';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    TypeOrmModule.forFeature([Collections]),
  ],
  controllers: [],
  providers: [CollectionsProcessor, CrawlerService],
})
export class CrawlerModule {}
