import { Injectable, Logger } from '@nestjs/common';
import { Store } from '@subsquid/typeorm-store';
import {
  BlockHandlerContext,
  SubstrateExtrinsic,
} from '@subsquid/substrate-processor';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ISubscriberService } from './subscribers.service';
import { ProcessorService } from './processor/processor.service';
import { BlockService } from '../services/block.service';
import { ExtrinsicService } from '../services/extrinsic.service';
import { EventService } from '../services/event/event.service';
import { Event } from '@entities/Event';
import { logger } from 'ethers';
import { ReaderRepository } from '@unique-nft/harvester/src/database';
import { HarvesterStoreService } from './processor/harvester-store.service';
import * as console from 'console';

export interface IEvent {
  name: string;
  extrinsic: SubstrateExtrinsic;
  indexInBlock: number;
  phase: string;
  args: { value?: string; amount?: string };
}

export type IBlockItem =
  | {
      kind: 'event';
      name: string;
      event: IEvent;
    }
  | {
      kind: 'call';
      name: string;
      extrinsic: SubstrateExtrinsic;
    };

export interface IBlockCommonData {
  blockNumber: number;
  blockTimestamp: number;
  ss58Prefix: number;
  blockHash?: string;
}

export interface IItemCounts {
  totalEvents: number;
  totalExtrinsics: number;
  numTransfers: number;
  newAccounts: number;
}

export interface EventsProcessingResult {
  events: Event[];
  collectionsResult: ItemsBatchProcessingResult | null;
  tokensResult: ItemsBatchProcessingResult | null;
}

export interface ItemsBatchProcessingResult {
  totalEvents: number;
  rejected: object[];
}

@Injectable()
export class BlocksSubscriberService implements ISubscriberService {
  private readonly logger = new Logger(BlocksSubscriberService.name);

  constructor(
    private blockService: BlockService,
    private extrinsicService: ExtrinsicService,
    private eventService: EventService,

    private harvesterStore: HarvesterStoreService,
    private reader: ReaderRepository,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(BlocksSubscriberService.name);
  }

  async subscribe() {
    const stateNumber = await this.harvesterStore.getState(true);
    console.dir(stateNumber);
    for await (const block of this.reader.readBlocks(stateNumber)) {
      console.dir(block, { depth: 4 });
    }
  }

  private async upsertHandler(ctx): Promise<void> {
    const { block, items } = ctx;
    const {
      height: blockNumber,
      timestamp: blockTimestamp,
      hash: blockHash,
    } = block;
    const blockItems = items as unknown as IBlockItem[];

    const log = {
      blockNumber,
    };

    try {
      const ss58Prefix = ctx._chain?.getConstant(
        'System',
        'SS58Prefix',
      ) as number;

      const blockCommonData = {
        blockNumber,
        blockTimestamp,
        ss58Prefix,
        blockHash,
      } as IBlockCommonData;

      // Process events first to get event.values
      const { events, collectionsResult, tokensResult } =
        await this.eventService.process({
          blockCommonData,
          blockItems,
        });

      const [itemCounts] = await Promise.all([
        this.blockService.upsert({
          block,
          blockItems,
        }),
        this.extrinsicService.upsert({
          blockCommonData,
          blockItems,
          events,
        }),
      ]);

      this.logger.verbose({
        ...log,
        ...itemCounts,

        // Collections service results
        totalCollectionEvents: collectionsResult?.totalEvents ?? undefined,
        totalRejectedCollections:
          collectionsResult?.rejected.length ?? undefined,

        // Tokens service results
        totalTokenEvents: tokensResult?.totalEvents ?? undefined,
        totalRejectedTokens: tokensResult?.rejected.length ?? undefined,
      });

      if (collectionsResult?.rejected.length || tokensResult?.rejected.length) {
        const { rejected: rejectedCollections } = collectionsResult;
        const { rejected: rejectedTokens } = tokensResult;

        const sentry = this.sentry.instance();
        sentry.setContext('block-subscriber', {
          level: 'warning',
          extra: { rejectedCollections, rejectedTokens },
        });
        sentry.captureMessage('Some collections or tokens were rejected');
      }
    } catch (error) {
      this.logger.error({ ...log, error: error.message || error });
      this.sentry.instance().captureException({ ...log, error });
    }
  }
}
