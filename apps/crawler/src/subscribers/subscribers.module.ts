import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlocksSubscriberService } from './blocks.subscriber.service';
import { AccountsSubscriberService } from './accounts.subscriber.service';
import { ServicesModule } from '../services/services.module';
import { ProcessorConfigService } from '../config/processor.config.service';
import { SubscribersService } from './subscribers.service';
import { BlocksRepository } from '@unique-nft/harvester/src/database/repositories/private.repositories';
import { HarvesterStoreService } from './processor/harvester-store.service';

@Module({
  imports: [ConfigModule, ServicesModule],
  providers: [
    ProcessorConfigService,
    AccountsSubscriberService,
    BlocksSubscriberService,
    SubscribersService,
    HarvesterStoreService,
    BlocksRepository,
  ],
  exports: [SubscribersService],
})
export class SubscribersModule {}
