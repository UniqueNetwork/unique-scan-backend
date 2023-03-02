import { SubscriberName } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/config.module';
import { AccountsSubscriberService } from './accounts.subscriber.service';
import { BlocksSubscriberService } from './blocks.subscriber.service';
import { ProcessorService } from './processor/processor.service';

export interface ISubscriberService {
  subscribe(processorService: ProcessorService);
}

@Injectable()
export class SubscribersService {
  constructor(
    private configService: ConfigService<Config>,
    private processorService: ProcessorService,
    private accountsSubscriberService: AccountsSubscriberService,
    private blocksSubscriberService: BlocksSubscriberService,
  ) {}

  run() {
    const subscribersConfig = this.configService.get('subscribers');

    if (subscribersConfig[SubscriberName.ACCOUNTS]) {
      this.accountsSubscriberService.subscribe(this.processorService);
    }

    if (subscribersConfig[SubscriberName.BLOCKS]) {
      this.blocksSubscriberService.subscribe(this.processorService);
    }

    return this.processorService.run(this.configService.get('rescan'));
  }
}
