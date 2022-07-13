import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProcessorConfigService } from './processor.config.service';
import { CollectionsProcessor } from './processors/collections-processor';
import { TokensProcessor } from './processors/tokens-processor';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private dataSource: DataSource,
    private collectionsProcessor: CollectionsProcessor,
    private tokensProcessor: TokensProcessor,
    private processorConfigService: ProcessorConfigService,
  ) {}

  subscribeAll(forceRescan = false) {
    const range = this.processorConfigService.getRange();

    return Promise.all([
      // this.subscribeCollections({ range, forceRescan }),
      this.subscribeTokens({ range, forceRescan }),
    ]);
  }

  async subscribeCollections({ range, forceRescan }) {
    if (forceRescan && !isNaN(range.from)) {
      try {
        const statusDbSchemaName = `${this.collectionsProcessor.name}_status`;

        // Set status height to range.from to rescan old blocks
        await this.dataSource.query(
          `UPDATE ${statusDbSchemaName}.status SET height = ${range.from} WHERE id = 0`,
        );
      } catch (err) {
        // First run, no schema yet
      }
    }

    this.collectionsProcessor.run();
  }

  async subscribeTokens({ range, forceRescan }) {
    if (forceRescan && !isNaN(range.from)) {
      try {
        const statusDbSchemaName = `${this.tokensProcessor.name}_status`;

        // Set status height to range.from to rescan old blocks
        await this.dataSource.query(
          `UPDATE ${statusDbSchemaName}.status SET height = ${range.from} WHERE id = 0`,
        );
      } catch (err) {
        // First run, no schema yet
      }
    }

    this.tokensProcessor.run();
  }
}
