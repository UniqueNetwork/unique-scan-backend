import typeormConfig from '@common/typeorm.config';
import { UtilsModule } from '@common/utils/utils.module';
// import { Collections } from '@entities/Collections';
// import { Tokens } from '@entities/Tokens';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrawlerService } from './crawler.service';
import { ProcessorsModule } from './processors/processors.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeormConfig),
    // TypeOrmModule.forFeature([Collections, Tokens]),
    ProcessorsModule,
    UtilsModule,
  ],
  controllers: [],
  providers: [Logger, CrawlerService],
})
export class CrawlerModule {}
