import typeormConfig from '@common/typeorm.config';
import { UtilsModule } from '@common/utils/utils.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from './processor.config.service';
import { CrawlerService } from './crawler.service';
import { ProcessorsModule } from './processors/processors.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    ProcessorsModule,
    UtilsModule,
  ],
  controllers: [],
  providers: [Logger, CrawlerService, ProcessorConfigService],
})
export class CrawlerModule {}
