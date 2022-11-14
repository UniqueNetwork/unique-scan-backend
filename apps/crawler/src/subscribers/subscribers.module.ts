import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    SubscribersService,
  ],
  exports: [SubscribersService],
})
export class SubscribersModule {}
