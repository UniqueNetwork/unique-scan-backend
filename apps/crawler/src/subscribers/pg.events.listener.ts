import { Client as PgClient } from 'pg';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { BlocksSubscriberService } from './blocks.subscriber.service';
import { HarvesterStoreService } from './processor/harvester-store.service';

enum PG_EVENTS_CHANNELS {
  FORCE_RESCAN_BLOCK = 'force_rescan_block',
  START_FAST_RESCAN = 'start_fast_rescan',
  STOP_FAST_RESCAN = 'stop_fast_rescan',
}

type NextBlocksQueryParams = {
  from: number;
  to: number;
  offset: number;
  limit: number;
};

const FAST_RESCAN_PAGE_SIZE = 10;

@Injectable()
export class PgEventsListener implements OnApplicationBootstrap {
  readonly logger = new Logger(PgEventsListener.name);
  private client: PgClient;

  private isFastRescanActive = false;

  constructor(
    private blocksSubscriberService: BlocksSubscriberService,
    private harvesterStore: HarvesterStoreService,
  ) {
    const config = {
      host: process.env.POSTGRES_HOST,
      port: +process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
    };

    this.client = new PgClient(config);
  }

  async onApplicationBootstrap() {
    await this.listenPgEvents();
  }

  async listenPgEvents() {
    this.client.on('notification', async ({ channel, payload }) => {
      this.logger.log(
        `Received notification on channel ${channel}, payload: ${payload}`,
      );

      if (!channel) {
        return;
      }

      if (channel === PG_EVENTS_CHANNELS.FORCE_RESCAN_BLOCK) {
        await this.handleRescanBlocks(payload);
      }

      if (channel === PG_EVENTS_CHANNELS.START_FAST_RESCAN) {
        await this.startFastRescan(payload || '');
      }

      if (channel === PG_EVENTS_CHANNELS.STOP_FAST_RESCAN) {
        this.stopFastRescan('manual');
      }
    });

    await this.client.connect();

    for (const channel of Object.values(PG_EVENTS_CHANNELS)) {
      await this.client.query(`LISTEN ${channel}`);
      this.logger.log(`Listening for notifications on channel ${channel}`);
    }
  }

  private async handleRescanBlocks(payload: string) {
    const blockNumbers = PgEventsListener.parseBlockNumbersPayload(payload);

    this.logger.log(`Going to force rescan blocks: ${blockNumbers.join(', ')}`);

    for (const blockNumber of blockNumbers) {
      this.logger.log(`Rescan for block ${blockNumber}`);

      await this.blocksSubscriberService.processBlockByNumber(blockNumber);

      this.logger.log(`Rescan for block ${blockNumber} finished`);
    }
  }

  private async startFastRescan(payload: string) {
    if (this.isFastRescanActive) {
      this.logger.warn('Fast rescan is already active');

      return;
    }

    const range = PgEventsListener.parseBlockRangePayload(payload);
    const { from } = range;
    const to = range.to || (await this.harvesterStore.getState())[0];

    this.logger.log(`Going to start fast rescan from ${from} to ${to}`);

    let offset = 0;

    this.isFastRescanActive = true;
    while (this.isFastRescanActive) {
      const nextBlockNumbers = await this.getNextBlocks({
        from,
        to,
        offset,
        limit: FAST_RESCAN_PAGE_SIZE,
      });

      if (nextBlockNumbers.length === 0) {
        this.logger.log(
          'Fast rescan finished because no more blocks to rescan',
        );
        this.stopFastRescan('all blocks processed');

        return;
      }

      for (const blockNumber of nextBlockNumbers) {
        this.logger.log(`Rescan for block ${blockNumber}`);

        await this.blocksSubscriberService.processBlockByNumber(blockNumber);

        this.logger.log(`Rescan for block ${blockNumber} finished`);
      }

      offset += FAST_RESCAN_PAGE_SIZE;
    }
  }

  private stopFastRescan(reason = 'unknown') {
    this.logger.log(`Stopping fast rescan for reason: ${reason}`);
    this.isFastRescanActive = false;
  }

  private async getNextBlocks(
    params: NextBlocksQueryParams,
  ): Promise<number[]> {
    const { from, to, offset, limit } = params;

    const { rows } = await this.client.query<{ blockId: number }>(
      `
        SELECT distinct("blockId") as "blockId"
        FROM harvester_extrinsics he
        WHERE he."section" != 'parachainSystem'
        AND he."section" != 'timestamp'
        AND he."blockId" >= $1
        AND he."blockId" <= $2
        ORDER BY he."blockId"
        OFFSET $3
        LIMIT $4;
      `,
      [from, to, offset, limit],
    );

    return rows.map(({ blockId }) => blockId);
  }

  static parseBlockNumbersPayload(payload: string): number[] {
    return payload
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n));
  }

  static parseBlockRangePayload(payload: string): {
    from: number;
    to: number;
  } {
    const numbers = payload.split('-').map((n) => parseInt(n.trim(), 10));

    if (numbers.length !== 2) {
      throw new Error(
        `Invalid block range payload ${payload}, expected format: from-to`,
      );
    }

    const from = Math.min(...numbers);
    const to = Math.max(...numbers);

    return { from, to };
  }
}
