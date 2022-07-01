import { Injectable, Logger } from '@nestjs/common';
import { DataSource as SubscquidDataSource } from '@subsquid/substrate-processor';
import { Range } from '@subsquid/substrate-processor/lib/util/range';
import { DataSource } from 'typeorm';
import { CollectionsProcessor } from './processors/collections-processor';

@Injectable()
export class CrawlerService {
  constructor(
    private logger: Logger,
    private dataSource: DataSource,
    private collectionsProcessor: CollectionsProcessor,
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

    return Promise.all([this.subscribeCollections({ ...params, forceRescan })]);
  }

  async subscribeCollections({ dataSource, range, typesBundle, forceRescan }) {
    if (forceRescan && !isNaN(range.from)) {
      const statusDbSchemaName = `${this.collectionsProcessor.name}_status`;

      // Set status height to range.from to rescan old blocks
      await this.dataSource.query(
        `UPDATE ${statusDbSchemaName}.status SET height = ${range.from} WHERE id = 0`,
      );
    }

    this.collectionsProcessor.init(dataSource, range, typesBundle);

    this.collectionsProcessor.run();
  }
}
