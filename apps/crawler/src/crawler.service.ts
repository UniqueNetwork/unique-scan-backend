import { Injectable, Logger } from '@nestjs/common';
import { ProcessorService } from './processors/processor.service';
import { CollectionsSubscriberService } from './processors/collections-subscriber.service';
import { ProcessorConfigService } from './processor.config.service';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private processorConfigService: ProcessorConfigService,
    private processorService: ProcessorService,
    private collectionsSubscriberService: CollectionsSubscriberService,
  ) {}

  async subscribe(forceRescan = false) {
    const params = this.processorConfigService.getAllParams();

    this.logger.log(params);

    return this.processorService.run(forceRescan);
  }
}
