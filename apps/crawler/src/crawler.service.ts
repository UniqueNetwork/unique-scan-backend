import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessorService } from './subscribers/processor.service';
import { AccountsSubscriberService } from './subscribers/accounts-subscriber.service';
import { BlocksSubscriberService } from './subscribers/blocks-subscriber.service';
import { CollectionsSubscriberService } from './subscribers/collections-subscriber.service';
import { TokensSubscriberService } from './subscribers/tokens-subscriber.service';
import { Config } from './config/config.module';
import { SubscriberName } from './config/subscribers.config';

@Injectable()
export class CrawlerService {
  constructor(
    private configService: ConfigService<Config>,
    private processorService: ProcessorService,
    private accountsSubscriberService: AccountsSubscriberService,
    private blocksSubscriberService: BlocksSubscriberService,
    private collectionsSubscriberService: CollectionsSubscriberService,
    private tokensSubscriberService: TokensSubscriberService,
  ) {}

  run(forceRescan = false) {
    if (this.configService.get('subscribers')[SubscriberName.ACCOUNTS]) {
      this.accountsSubscriberService.subscribe();
    }

    if (this.configService.get('subscribers')[SubscriberName.BLOCKS]) {
      this.blocksSubscriberService.subscribe();
    }

    if (this.configService.get('subscribers')[SubscriberName.COLLECTIONS]) {
      this.collectionsSubscriberService.subscribe();
    }

    if (this.configService.get('subscribers')[SubscriberName.TOKENS]) {
      this.tokensSubscriberService.subscribe();
    }

    return this.processorService.run(forceRescan);
  }
}
