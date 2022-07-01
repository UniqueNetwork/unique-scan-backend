import typeormConfig from '@common/typeorm.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from './crawler.service';
import { ProcessorsModule } from './processors/processors.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    ProcessorsModule,
  ],
  controllers: [],
  providers: [CrawlerService],
})
export class CrawlerModule {}
