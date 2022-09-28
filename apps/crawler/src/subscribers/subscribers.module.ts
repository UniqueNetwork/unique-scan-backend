import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollectionsSubscriberService } from './collections.subscriber.service';
import { TokensSubscriberService } from './tokens.subscriber.service';
import { BlocksSubscriberService } from './blocks.subscriber.service';
import { AccountsSubscriberService } from './accounts.subscriber.service';
import { ServicesModule } from '../services/services.module';
import { ProcessorConfigService } from '../config/processor.config.service';
import { ProcessorService } from './processor/processor.service';
import { SubscribersService } from './subscribers.service';

@Module({
  imports: [ConfigModule, ServicesModule],
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
