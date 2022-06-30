import { Injectable } from '@nestjs/common';
import { CollectionsProcessor } from './collections-processor';

@Injectable()
export class CrawlerService {
  constructor(private collectionsProcessor: CollectionsProcessor) {}

  subscribe() {
    this.collectionsProcessor.run();
  }
}
