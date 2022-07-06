import { Injectable, Logger } from '@nestjs/common';
import { DataSource as SubscquidDataSource } from '@subsquid/substrate-processor';
import { Range } from '@subsquid/substrate-processor/lib/util/range';
import { DataSource } from 'typeorm';
import { CollectionsProcessor } from './processors/collections-processor';
import { TokensProcessor } from './processors/tokens-processor';

@Injectable()
export class CrawlerService {
  constructor(
    private logger: Logger,
    private dataSource: DataSource,
    private collectionsProcessor: CollectionsProcessor,
    private tokensProcessor: TokensProcessor,
  ) {
    this.logger = new Logger('CrawlerService');
  }

  private prepareProcessorsParams() {
    const dataSource = {
      archive: process.env.ARCHIVE_GQL_URL,
      chain: process.env.CHAIN_WS_URL,
    } as SubscquidDataSource;

    const range = {
      from:
        Number(process.env.SCAN_RANGE_FROM) ||
        Number(process.env.SCAN_RANGE_FROM_DEFAULT),
    } as Range;

    if (!isNaN(Number(process.env.SCAN_RANGE_TO))) {
      range.to = Number(process.env.SCAN_RANGE_TO);
    }

    const params = {
      dataSource,
      range,
      typesBundle: process.env.SCAN_TYPES_BUNDLE,
    };

    this.logger.log({
      msg: 'Start crawler',
      params,
    });

    return params;
  }

  subscribeAll(forceRescan = false) {
    const params = this.prepareProcessorsParams();

    return Promise.all([
      // this.subscribeCollections({ ...params, forceRescan }),
      this.subscribeTokens({ ...params, forceRescan }),
    ]);
  }

  async subscribeCollections({ dataSource, range, typesBundle, forceRescan }) {
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

    this.collectionsProcessor.init(dataSource, range, typesBundle);

    this.collectionsProcessor.run();
  }

  async subscribeTokens({ dataSource, range, typesBundle, forceRescan }) {
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

    this.tokensProcessor.init(dataSource, range, typesBundle);

    this.tokensProcessor.run();
  }
}
