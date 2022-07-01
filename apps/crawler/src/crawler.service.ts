import { Injectable } from '@nestjs/common';
import { DataSource } from '@subsquid/substrate-processor';
import { Range } from '@subsquid/substrate-processor/lib/util/range';
import { CollectionsProcessor } from './processors/collections-processor';

@Injectable()
export class CrawlerService {
  constructor(private collectionsProcessor: CollectionsProcessor) {}

  private prepareProcessorsParams() {
    const dataSource = {
      archive: process.env.ARCHIVE_GQL_URL,
      chain: process.env.CHAIN_WS_URL,
    } as DataSource;

    const range = {
      from: Number(process.env.SCAN_RANGE_FROM),
    } as Range;

    if (!isNaN(Number(process.env.SCAN_RANGE_TO))) {
      range.to = Number(process.env.SCAN_RANGE_TO);
    }

    return {
      dataSource,
      range,
      typesBundle: process.env.SCAN_TYPES_BUNDLE,
    };
  }

  subscribeAll(forceRescan = false) {
    const params = this.prepareProcessorsParams();

    return Promise.all([this.subscribeCollections({ ...params, forceRescan })]);
  }

  async subscribeCollections({ dataSource, range, typesBundle, forceRescan }) {
    if (forceRescan) {
      // todo: Set status height to range.from
    }

    this.collectionsProcessor.init(dataSource, range, typesBundle);

    this.collectionsProcessor.run();
  }
}
