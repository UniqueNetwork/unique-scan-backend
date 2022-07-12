import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UtilsModule } from '@common/utils/utils.module';
import { Extrinsic } from '@entities/Extrinsic';
import { Block } from '@entities/Block';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { ConfigModule } from '@nestjs/config';
import { Event } from '@entities/Event';
import { ProcessorConfigService } from '../processor.config.service';
import { ExtrinsicProcessor } from './extrinsic-processor';
import { SdkService } from '../sdk.service';
import { BlockProcessor } from './block-processor';
import { CollectionsProcessor } from './collections-processor';
import { TokensProcessor } from './tokens-processor';
import { EventProcessor } from './events-processor';

@Module({
  imports: [
    UtilsModule,
    ConfigModule,
    TypeOrmModule.forFeature([Collections, Tokens, Block, Extrinsic, Event]),
  ],
  providers: [
    SdkService,
    CollectionsProcessor,
    TokensProcessor,
    BlockProcessor,
    ExtrinsicProcessor,
    EventProcessor,
    ProcessorConfigService,
  ],
  exports: [
    CollectionsProcessor,
    TokensProcessor,
    BlockProcessor,
    ExtrinsicProcessor,
    EventProcessor,
  ],
})
export class ProcessorsModule {}
