import { SubscriberName } from '@common/constants';
import { Injectable, Logger } from '@nestjs/common';
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

  private logger = new Logger(SubscribersService.name);

  async run() {
    const subscribersConfig = this.configService.get('subscribers');

    if (subscribersConfig[SubscriberName.BLOCKS]) {
      this.blocksSubscriberService
        .subscribe()
        .then(() => this.logger.log('subscribe() resolved'));
    }

    //return this.processorService.run(this.configService.get('rescan'));
  }
}
