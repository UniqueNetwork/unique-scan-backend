import { SubscriberName } from '@common/constants';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/config.module';
import { AccountsSubscriberService } from './accounts.subscriber.service';
import { BlocksSubscriberService } from './blocks.subscriber.service';

export interface ISubscriberService {
  subscribe();
}

@Injectable()
export class SubscribersService {
  constructor(
    private configService: ConfigService<Config>,

    private accountsSubscriberService: AccountsSubscriberService,
    private blocksSubscriberService: BlocksSubscriberService,
  ) {}

  run() {
    const subscribersConfig = this.configService.get('subscribers');

    if (subscribersConfig[SubscriberName.BLOCKS]) {
      this.blocksSubscriberService.subscribe();
    }

    //return this.processorService.run(this.configService.get('rescan'));
  }
}
