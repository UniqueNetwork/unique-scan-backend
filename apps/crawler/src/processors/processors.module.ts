import { Block } from '@entities/Block';
import { Collections } from '@entities/Collections';
import { Tokens } from '@entities/Tokens';
import { Event } from '@entities/Event';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorConfigService } from '../processor.config.service';
import { SdkService } from '../sdk.service';
import { ProcessorService } from './processor.service';
import { SubstrateProcessor } from '@subsquid/substrate-processor';
import { CollectionsSubscriberService } from './collections-subscriber.service';
import { TokensSubscriberService } from './tokens-subscriber.service';
import { BlocksSubscriberService } from './blocks-subscriber.service';
import { Extrinsic } from '@entities/Extrinsic';

@Module({
  imports: [
    TypeOrmModule.forFeature([Block, Collections, Event, Extrinsic, Tokens]),
    ConfigModule,
  ],
  providers: [
    SubstrateProcessor,
    ProcessorService,
    SdkService,
    ProcessorConfigService,
    BlocksSubscriberService,
    CollectionsSubscriberService,
    TokensSubscriberService,
  ],
  exports: [
    ProcessorService,
    BlocksSubscriberService,
    CollectionsSubscriberService,
    TokensSubscriberService,
  ],
})
export class ProcessorsModule {}
