import { Injectable, Logger } from '@nestjs/common';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { ISubscriberService } from './subscribers.service';
import { BlockService } from '../services/block.service';
import { ExtrinsicService } from '../services/extrinsic.service';
import { EventService } from '../services/event/event.service';
import { Event } from '@entities/Event';
import { HarvesterStoreService } from './processor/harvester-store.service';
import * as console from 'console';
import { Reader } from '@unique-nft/harvester';
import { cyan, green, blue, magenta, yellow } from 'cli-color';
import { capitalize } from '@common/utils';
import { BlockEntity } from '@unique-nft/harvester/src/database/entities';
import { SdkService } from '../sdk/sdk.service';
import { EventName } from '@common/constants';
import { Block } from '@entities/Block';

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
  private readonly logger = new Logger(BlocksSubscriberService.name, {
    timestamp: true,
  });
  private isStartBlockService: boolean = false;
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
    await this.harvesterStore.connect();
    const chainProps = await this.sdkService.getChainProperties();
    const stateNumber = await this.harvesterStore.getState();

    console.dir(stateNumber);
    for await (const block of this.reader.readBlocks(
      stateNumber[0],
      stateNumber[1],
    )) {
      this.logger.log(`Read block: # ${cyan(block.id)}`);
      await this.upsertHandlerBlock(block);
    }
  }

  private async upsertHandlerBlock(blockData: BlockEntity): Promise<void> {
    let specHashData = null;
    let specDataChain = null;
    let specLastUpgrade = null;

    try {
      const { id, timestamp, hash, parentHash, extrinsics } = blockData;

      const countEvents = this.collectEventsCount(extrinsics);

      // First start
      if (specLastUpgrade === null) {
        specDataChain = await this.sdkService.getSpecLastUpgrade(hash);
        this.isStartBlockService = true;
        specLastUpgrade = specDataChain;
      }

      // New spec chain
      if (specHashData !== null && this.isStartBlockService) {
        specDataChain = await this.sdkService.getSpecLastUpgrade(specHashData);
        specLastUpgrade = specDataChain;
      }

      const blockTimestamp = new Date(timestamp).getTime();

      const blockCommonData = {
        block_number: +id,
        block_hash: hash,
        parent_hash: parentHash,
        extrinsics_root: '0x000', // TODO: remove this ???
        state_root: '0x000', // TODO: remove this ???
        ...specLastUpgrade,
        timestamp: blockTimestamp,
        total_events: countEvents.totalEvents,
        num_transfers: countEvents.numTransfers,
        new_accounts: countEvents.newAccounts,
        total_extrinsics: extrinsics.length,
      } as unknown as Block;

      const log = {
        blockNumber: id,
      };
      const { speckHash } = await this.eventService.process(
        extrinsics,
        blockCommonData,
      );
      specHashData = speckHash;
      await Promise.all([
        this.blockService.upsert(blockCommonData),
        this.extrinsicService.upsert(id, hash, extrinsics, blockTimestamp),
      ]);

      await this.harvesterStore.updateState(id);

      // Logger
      extrinsics.map((value) => {
        if (
          value.section !== 'parachainSystem' &&
          value.section !== 'timestamp'
        ) {
          const eventsNameArray = extrinsics
            .map((value) => {
              if (
                value.section !== 'parachainSystem' &&
                value.section !== 'timestamp'
              ) {
                return `${capitalize(value.section)}.${capitalize(
                  value.method,
                )}`;
              }
            })
            .filter((value) => !!value);

          this.logger.log(
            `Find in block: # ${blue(blockData.id)} events ${eventsNameArray}`,
          );
        }
      });
    } catch (error) {
      this.logger.error({ block: blockData.id, error: error.message || error });
      this.sentry.instance().captureException({ block: blockData.id, error });
    }
  }

  private collectEventsCount(extrinsics) {
    const itemCounts = {
      totalEvents: 0,
      numTransfers: 0,
      newAccounts: 0,
    };

    extrinsics.map((ext) => {
      ext.events.forEach((event) => {
        const name = `${capitalize(event.section)}.${capitalize(event.method)}`;
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
