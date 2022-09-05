import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollectionsSubscriberService } from './collections-subscriber.service';
import { TokensSubscriberService } from './tokens-subscriber.service';
import { BlocksSubscriberService } from './blocks-subscriber.service';
import { AccountsSubscriberService } from './accounts-subscriber.service';
import { SdkModule } from '../sdk/sdk.module';
import { WritersModule } from '../writers/writers.module';
import { ProcessorConfigService } from '../config/processor.config.service';
import { ProcessorService } from './processor/processor.service';
import { SubscribersService } from './subscribers.service';

@Module({
  imports: [ConfigModule, SdkModule, WritersModule],
  providers: [
    ProcessorService,
    ProcessorConfigService,
    AccountsSubscriberService,
    BlocksSubscriberService,
    CollectionsSubscriberService,
    TokensSubscriberService,
    SubscribersService,
  ],
  exports: [SubscribersService],
})
export class SubscribersModule {}
