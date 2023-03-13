import { Injectable, Logger } from '@nestjs/common';
import { SubstrateExtrinsic } from '@subsquid/substrate-processor';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ISubscriberService } from './subscribers.service';
import { BlockService } from '../services/block.service';
import { ExtrinsicService } from '../services/extrinsic.service';
import { EventService } from '../services/event/event.service';
import { Event } from '@entities/Event';
import { HarvesterStoreService } from './processor/harvester-store.service';
import * as console from 'console';
import { Reader } from '@unique-nft/harvester';
import { magenta, bgGreen, cyan, black, green } from 'cli-color';
import { capitalize, normalizeTimestamp } from '@common/utils';
import {
  BlockEntity,
  ExtrinsicEntity,
} from '@unique-nft/harvester/src/database/entities';
import { SdkService } from '../sdk/sdk.service';
import { ChainProperties } from '@unique-nft/substrate-client/types';
import { EventName } from '@common/constants';
import { Block } from '@entities/Block';

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

export interface IBlockDataContainer {
  block_number: number;
  block_hash: string;
  parent_hash: string;
  extrinsics_root?: string;
  state_root?: string;
  spec_name: string;
  spec_version: string;
  timestamp: string;
  total_events: number;
  num_transfers: number;
  new_accounts: number;
  total_extrinsics: number;
}

export interface ISpecSystemVersion {
  spec_version: number;
  spec_name: string;
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

    private sdkService: SdkService,
    private extrinsicService: ExtrinsicService,
    private eventService: EventService,

    private harvesterStore: HarvesterStoreService,

    private reader: Reader,

    @InjectSentry()
    private readonly sentry: SentryService,
  ) {
    this.sentry.setContext(BlocksSubscriberService.name);
  }

  async subscribe() {
    const chainProps = await this.sdkService.getChainProperties();
    const stateNumber = await this.harvesterStore.getState(true);

    console.dir(stateNumber);
    for await (const block of this.reader.readBlocks(
      stateNumber[0],
      stateNumber[1],
    )) {
      await this.upsertHandlerBlock(block, chainProps);
      //console.dir(block, { depth: 100 });
    }
  }

  private async upsertHandlerBlock(
    blockData: BlockEntity,
    chain: ChainProperties,
  ): Promise<void> {
    const { SS58Prefix } = chain;
    const { id, timestamp, hash, parentHash, extrinsics } = blockData;

    const countEvents = this.collectEventsCount(extrinsics);
    const specDataChain = await this.sdkService.getSpecLastUpgrade(hash);
    const blockTimestamp = new Date(timestamp).getTime();

    const blockCommonData = {
      block_number: +id,
      block_hash: hash,
      parent_hash: parentHash,
      extrinsics_root: '0x000', // TODO: remove this ???
      state_root: '0x000', // TODO: remove this ???
      ...specDataChain,
      timestamp: blockTimestamp,
      total_events: countEvents.totalEvents,
      num_transfers: countEvents.numTransfers,
      new_accounts: countEvents.newAccounts,
      total_extrinsics: extrinsics.length,
    } as unknown as Block;

    const log = {
      blockNumber: id,
    };
    extrinsics.map((value) => {
      if (
        value.section !== 'parachainSystem' &&
        value.section !== 'timestamp'
      ) {
        console.log(
          `█ `,
          blockCommonData.block_number,
          green(' ▶'),
          blockCommonData.total_events > 2
            ? magenta(' extrinsic:')
            : green(' extrinsic:'),
          blockCommonData.total_extrinsics,
          blockCommonData.total_events > 2
            ? magenta(' events:')
            : cyan(' events:'),
          blockCommonData.total_events,
          extrinsics.map((value) => `${value.section} - ${value.method}`),
          ' readed!',
        );
      }
    });

    // console.log(
    //   `█ `,
    //   blockCommonData.block_number,
    //   green(' ▶'),
    //   blockCommonData.total_events > 2
    //     ? magenta(' extrinsic:')
    //     : green(' extrinsic:'),
    //   blockCommonData.total_extrinsics,
    //   blockCommonData.total_events > 2 ? magenta(' events:') : cyan(' events:'),
    //   blockCommonData.total_events,
    //   extrinsics.map((value) => `${value.section} - ${value.method}`),
    //   ' readed!',
    // );

    //const { events, collectionsResult, tokensResult } =
    await this.eventService.processNew(extrinsics, blockCommonData);

    const [itemCounts] = await Promise.all([
      this.blockService.upsert(blockCommonData),
      this.extrinsicService.upsert(id, hash, extrinsics, blockTimestamp),
    ]);

    // this.logger.verbose({
    //   ...log,
    //   ...countEvents,
    //
    //   // Collections service results
    //   //totalCollectionEvents: collectionsResult?.totalEvents ?? undefined,
    //   //totalRejectedCollections: collectionsResult?.rejected.length ?? undefined,
    //
    //   // Tokens service results
    //   //totalTokenEvents: tokensResult?.totalEvents ?? undefined,
    //   //totalRejectedTokens: tokensResult?.rejected.length ?? undefined,
    // });
  }

  // private async upsertHandler(ctx): Promise<void> {
  //   const { block, items } = ctx;
  //   const {
  //     height: blockNumber,
  //     timestamp: blockTimestamp,
  //     hash: blockHash,
  //   } = block;
  //   const blockItems = items as unknown as IBlockItem[];
  //
  //   const log = {
  //     blockNumber,
  //   };
  //
  //   try {
  //     const ss58Prefix = ctx._chain?.getConstant(
  //       'System',
  //       'SS58Prefix',
  //     ) as number;
  //
  //     const blockCommonData = {
  //       blockNumber,
  //       blockTimestamp,
  //       ss58Prefix,
  //       blockHash,
  //     } as IBlockCommonData;
  //
  //     // Process events first to get event.values
  //     const { events, collectionsResult, tokensResult } =
  //       await this.eventService.processNew(blockCommonData, blockItems);
  //
  //     const [itemCounts] = await Promise.all([
  //       this.blockService.upsert({
  //         block,
  //         blockItems,
  //       }),
  //       this.extrinsicService.upsert({
  //         blockCommonData,
  //         blockItems,
  //         events,
  //       }),
  //     ]);
  //
  //     this.logger.verbose({
  //       ...log,
  //       // ...itemCounts,
  //
  //       // Collections service results
  //       totalCollectionEvents: collectionsResult?.totalEvents ?? undefined,
  //       totalRejectedCollections:
  //         collectionsResult?.rejected.length ?? undefined,
  //
  //       // Tokens service results
  //       totalTokenEvents: tokensResult?.totalEvents ?? undefined,
  //       totalRejectedTokens: tokensResult?.rejected.length ?? undefined,
  //     });
  //
  //     if (collectionsResult?.rejected.length || tokensResult?.rejected.length) {
  //       const { rejected: rejectedCollections } = collectionsResult;
  //       const { rejected: rejectedTokens } = tokensResult;
  //
  //       const sentry = this.sentry.instance();
  //       sentry.setContext('block-subscriber', {
  //         level: 'warning',
  //         extra: { rejectedCollections, rejectedTokens },
  //       });
  //       sentry.captureMessage('Some collections or tokens were rejected');
  //     }
  //   } catch (error) {
  //     this.logger.error({ ...log, error: error.message || error });
  //     this.sentry.instance().captureException({ ...log, error });
  //   }
  // }

  private collectEventsCount(extrinsics) {
    const itemCounts = {
      totalEvents: 0,
      numTransfers: 0,
      newAccounts: 0,
    };

    extrinsics.map((ext) => {
      ext.events.forEach((event) => {
        const name = `${capitalize(event.section)}.${event.method}`;
        itemCounts.totalEvents += 1;
        if (name === EventName.BALANCES_TRANSFER) {
          itemCounts.numTransfers += 1;
        } else if (name === EventName.BALANCES_ENDOWED) {
          itemCounts.newAccounts += 1;
        }
      });
    });

    return itemCounts;
  }
}
