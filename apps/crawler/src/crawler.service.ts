import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProcessorConfigService } from './processor.config.service';
import { BlockProcessor } from './processors/block-processor';
import { CollectionsProcessor } from './processors/collections-processor';
import { TokensProcessor } from './processors/tokens-processor';
import { ExtrinsicProcessor } from './processors/extrinsic-processor';
import { EventProcessor } from './processors/events-processor';

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private dataSource: DataSource,
    private collectionsProcessor: CollectionsProcessor,
    private tokensProcessor: TokensProcessor,
    private blockProcessor: BlockProcessor,
    private extrinsicProcessor: ExtrinsicProcessor,
    private eventProcessor: EventProcessor,
    private processorConfigService: ProcessorConfigService,
  ) {}

  subscribeAll(forceRescan = false) {
    const range = this.processorConfigService.getRange();

    return Promise.all([
      this.subscribeCollections({ range, forceRescan }),
      this.subscribeTokens({ range, forceRescan }),
      this.subscribeBlock({ range, forceRescan }),
      this.subscribeExtrinsic({ range, forceRescan }),
      this.subscribeEvent({ range, forceRescan }),
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

  async subscribeBlock({ range, forceRescan }) {
    if (forceRescan) {
      try {
        const statusDbSchemaName = `${this.blockProcessor.name}_status`;

        // Set status height to range.from to rescan old blocks
        await this.dataSource.query(
          `UPDATE ${statusDbSchemaName}.status SET height = ${range.from} WHERE id = 0`,
        );
      } catch (err) {
        // First run, no schema yet
      }
    }

    this.blockProcessor.run();
  }

  async subscribeExtrinsic({ range, forceRescan }) {
    if (forceRescan) {
      try {
        const statusDbSchemaName = `${this.extrinsicProcessor.name}_status`;

        // Set status height to range.from to rescan old blocks
        await this.dataSource.query(
          `UPDATE ${statusDbSchemaName}.status SET height = ${range.from} WHERE id = 0`,
        );
      } catch (err) {
        // First run, no schema yet
      }
    }

    this.extrinsicProcessor.run();
  }

  async subscribeEvent({ range, forceRescan }) {
    if (forceRescan) {
      try {
        const statusDbSchemaName = `${this.eventProcessor.name}_status`;

        // Set status height to range.from to rescan old blocks
        await this.dataSource.query(
          `UPDATE ${statusDbSchemaName}.status SET height = ${range.from} WHERE id = 0`,
        );
      } catch (err) {
        // First run, no schema yet
      }
    }

    this.eventProcessor.run();
  }
}
