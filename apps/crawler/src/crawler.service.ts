import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessorService } from './processors/processor.service';
import { AccountsSubscriberService } from './processors/accounts-subscriber.service';
import { BlocksSubscriberService } from './processors/blocks-subscriber.service';
import { CollectionsSubscriberService } from './processors/collections-subscriber.service';
import { TokensSubscriberService } from './processors/tokens-subscriber.service';

@Injectable()
export class CrawlerService {
  constructor(
    private configService: ConfigService,
    private processorService: ProcessorService,
    private accountsSubscriberService: AccountsSubscriberService,
    private blocksSubscriberService: BlocksSubscriberService,
    private collectionsSubscriberService: CollectionsSubscriberService,
    private tokensSubscriberService: TokensSubscriberService,
  ) {}

  async subscribe(forceRescan = false) {
    if (this.configService.get('ACCOUNTS_SUBSCRIBER_DISABLE') !== 'true') {
      this.accountsSubscriberService.subscribe();
    }

    if (this.configService.get('BLOCKS_SUBSCRIBER_DISABLE') !== 'true') {
      this.blocksSubscriberService.subscribe();
    }

    if (this.configService.get('COLLECTIONS_SUBSCRIBER_DISABLE') !== 'true') {
      this.collectionsSubscriberService.subscribe();
    }

    if (this.configService.get('TOKENS_SUBSCRIBER_DISABLE') !== 'true') {
      this.tokensSubscriberService.subscribe();
    }

    return this.processorService.run(forceRescan);
  }
}
