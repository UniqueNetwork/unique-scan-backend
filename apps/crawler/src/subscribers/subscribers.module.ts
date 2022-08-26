import { Block } from '@entities/Block';
import { Tokens } from '@entities/Tokens';
import { Event } from '@entities/Event';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessorService } from './processor.service';
import { SubstrateProcessor } from '@subsquid/substrate-processor';
import { CollectionsSubscriberService } from './collections-subscriber.service';
import { TokensSubscriberService } from './tokens-subscriber.service';
import { BlocksSubscriberService } from './blocks-subscriber.service';
import { Extrinsic } from '@entities/Extrinsic';
import { Account } from '@entities/Account';
import { AccountsSubscriberService } from './accounts-subscriber.service';
import { SdkModule } from '../sdk/sdk.module';
import { WritersModule } from '../writers/writers.module';
import { ProcessorConfigService } from '../config/processor.config.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Block, Event, Extrinsic, Tokens]),
    ConfigModule,
    SdkModule,
    WritersModule,
  ],
  providers: [
    SubstrateProcessor,
    ProcessorService,
    ProcessorConfigService,
    AccountsSubscriberService,
    BlocksSubscriberService,
    CollectionsSubscriberService,
    TokensSubscriberService,
  ],
  exports: [
    ProcessorService,
    AccountsSubscriberService,
    BlocksSubscriberService,
    CollectionsSubscriberService,
    TokensSubscriberService,
  ],
})
export class SubscribersModule {}
