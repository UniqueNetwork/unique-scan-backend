// @ts-nocheck
import { DataSource, SubstrateProcessor } from '@subsquid/substrate-processor';
import { ServiceManager } from '@subsquid/substrate-processor/lib/util/sm';
import { Db } from '@subsquid/substrate-processor/lib/db';
import {
  createBatches,
  getBlocksCount,
} from '@subsquid/substrate-processor/lib/batch';
import { Ingest } from '@subsquid/substrate-processor/lib/ingest';
import { assertNotNull } from '@subsquid/util';
import { ResilientRpcClient } from '@subsquid/rpc-client/lib/resilient';
import { ProgressTracker } from '@subsquid/substrate-processor/lib/progress-tracker';
import { ChainManager } from '@subsquid/substrate-processor/lib/chain';
import { Connection } from 'typeorm';
import { Prometheus } from '@subsquid/substrate-processor/lib/prometheus';
import { Range } from '@subsquid/substrate-processor/lib/util/range';

export class ScanProcessor extends SubstrateProcessor {
  constructor(
    public name: string,
    protected connection: Connection,
    dataSource: DataSource,
    range: Range,
    typesBundle: string,
  ) {
    super(name);

    this.setDataSource(dataSource);
    this.setBlockRange(range);
    this.setTypesBundle(typesBundle);
  }

  private async _run(sm: ServiceManager): Promise<void> {
    const prometheus = new Prometheus();
    const prometheusServer = sm.add(
      await prometheus.serve(this.getPrometheusPort()),
    );

    // eslint-disable-next-line no-console
    console.log(
      `Prometheus metrics are served at port ${prometheusServer.port}`,
    );

    const db = sm.add(
      new Db(this.connection, {
        processorName: this.name,
      }),
    );

    const { height: heightAtStart } = await db.init();

    prometheus.setLastProcessedBlock(heightAtStart);

    let blockRange = this.blockRange;
    if (blockRange.to != null && blockRange.to < heightAtStart + 1) {
      return;
    } else {
      blockRange = {
        from: Math.max(heightAtStart + 1, blockRange.from),
        to: blockRange.to,
      };
    }

    const batches = createBatches(this.hooks, blockRange);

    const ingest = sm.add(
      new Ingest({
        archive: assertNotNull(
          this.src?.archive,
          'use .setDataSource() to specify archive url',
        ),
        batches$: batches,
        batchSize: this.batchSize,
        metrics: prometheus,
      }),
    );

    const client = sm.add(
      new ResilientRpcClient(
        assertNotNull(
          this.src?.chain,
          'use .setDataSource() to specify chain RPC endpoint',
        ),
      ),
    );

    const wholeRange = createBatches(this.hooks, this.blockRange);
    const progress = new ProgressTracker(
      getBlocksCount(wholeRange, heightAtStart),
      wholeRange,
      prometheus,
    );

    await this.process(
      ingest,
      new ChainManager(client, this.typesBundle),
      db,
      prometheus,
      progress,
    );
  }
}
